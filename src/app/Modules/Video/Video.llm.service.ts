import { Ollama } from 'ollama';
import config from '../../config';

// Initialize Ollama client
const ollama = new Ollama({
  host: config.ollama_host || 'http://localhost:11434',
});

interface PredictionData {
  predictions: Array<{
    time_range: string;
    app: string;
    action: string;
    app_confidence: number;
    action_confidence: number;
  }>;
  summary: {
    total_chunks: number;
    most_common_app: string;
    most_common_action: string;
    average_app_confidence: number;
    average_action_confidence: number;
    app_distribution: Record<string, number>;
    action_distribution: Record<string, number>;
  };
  video_info: {
    duration_seconds: number;
    num_chunks: number;
    chunk_duration: number;
    original_filename: string;
  };
}

/**
 * Generate a human-readable report from prediction data
 */
export const generateReport = async (
  predictionJson: string,
  reportType: 'summary' | 'workflow' = 'summary',
): Promise<string> => {
  try {
    const prediction: PredictionData = JSON.parse(predictionJson);

    // Create a prompt based on report type
    let prompt = '';

    if (reportType === 'summary') {
      prompt = createSummaryPrompt(prediction);
    } else {
      prompt = createWorkflowPrompt(prediction);
    }

    // Generate report using Ollama
    const response = await ollama.generate({
      model: 'llama3.2', // You can change this to other models
      prompt: prompt,
      stream: false,
    });

    return response.response;
  } catch (error) {
    console.error('Error generating report:', error);
    throw new Error('Failed to generate report');
  }
};

/**
 * Generate report with streaming support
 */
export const generateReportStream = async (
  predictionJson: string,
  reportType: 'summary' | 'workflow' = 'summary',
): Promise<AsyncGenerator<string>> => {
  const prediction: PredictionData = JSON.parse(predictionJson);

  let prompt = '';
  if (reportType === 'summary') {
    prompt = createSummaryPrompt(prediction);
  } else {
    prompt = createWorkflowPrompt(prediction);
  }

  const stream = await ollama.generate({
    model: 'llama3.2',
    prompt: prompt,
    stream: true,
  });

  async function* generateChunks() {
    for await (const chunk of stream) {
      yield chunk.response;
    }
  }

  return generateChunks();
};

/**
 * Create a summary report prompt
 */
function createSummaryPrompt(prediction: PredictionData): string {
  const { summary, video_info } = prediction;

  return `You are an AI assistant analyzing screen recording activity data. Generate a concise, professional summary report.

**Video Information:**
- Duration: ${Math.floor(video_info.duration_seconds / 60)} minutes ${Math.floor(video_info.duration_seconds % 60)} seconds
- Total Activities Detected: ${summary.total_chunks}

**Activity Summary:**
- Most Used Application: ${summary.most_common_app} (used ${summary.app_distribution[summary.most_common_app]} times)
- Most Common Action: ${summary.most_common_action} (${summary.action_distribution[summary.most_common_action]} occurrences)
- Average App Detection Confidence: ${(summary.average_app_confidence * 100).toFixed(1)}%
- Average Action Detection Confidence: ${(summary.average_action_confidence * 100).toFixed(1)}%

**Application Usage Distribution:**
${Object.entries(summary.app_distribution)
  .sort(([, a], [, b]) => b - a)
  .slice(0, 5)
  .map(([app, count]) => `- ${app}: ${count} times`)
  .join('\n')}

**Action Distribution:**
${Object.entries(summary.action_distribution)
  .sort(([, a], [, b]) => b - a)
  .slice(0, 5)
  .map(([action, count]) => `- ${action}: ${count} times`)
  .join('\n')}

Generate a professional 2-3 paragraph summary that describes:
1. What the user was primarily doing during this recording
2. Key applications and activities observed
3. Overall productivity patterns or workflow observed

Write in a clear, professional tone suitable for a work report.`;
}

/**
 * Create a workflow analysis report prompt
 */
function createWorkflowPrompt(prediction: PredictionData): string {
  const { predictions, summary, video_info } = prediction;

  // Analyze consecutive activities to identify task sessions
  const taskSessions: Array<{
    app: string;
    action: string;
    startTime: number;
    endTime: number;
    duration: number;
  }> = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let currentSession: any = null;

  predictions.forEach((pred, idx) => {
    const [startStr] = pred.time_range.split('-');
    const startTime = parseInt(startStr.replace('s', ''));
    const endTime = startTime + video_info.chunk_duration;

    if (
      !currentSession ||
      currentSession.app !== pred.app ||
      currentSession.action !== pred.action
    ) {
      if (currentSession) {
        taskSessions.push({
          ...currentSession,
          endTime: currentSession.endTime,
          duration: currentSession.endTime - currentSession.startTime,
        });
      }
      currentSession = {
        app: pred.app,
        action: pred.action,
        startTime: startTime,
        endTime: endTime,
      };
    } else {
      currentSession.endTime = endTime;
    }

    if (idx === predictions.length - 1 && currentSession) {
      taskSessions.push({
        ...currentSession,
        endTime: currentSession.endTime,
        duration: currentSession.endTime - currentSession.startTime,
      });
    }
  });

  // Group by app and calculate total time
  const appTimeMap: Record<string, number> = {};
  taskSessions.forEach((session) => {
    if (!appTimeMap[session.app]) {
      appTimeMap[session.app] = 0;
    }
    appTimeMap[session.app] += session.duration;
  });

  // Get top 10 longest sessions
  const topSessions = [...taskSessions]
    .sort((a, b) => b.duration - a.duration)
    .slice(0, 10);

  return `You are an AI assistant analyzing a user's workflow from screen recording data. Generate a detailed workflow analysis report.

**Session Overview:**
- Total Duration: ${Math.floor(video_info.duration_seconds / 60)} minutes ${Math.floor(video_info.duration_seconds % 60)} seconds
- Total Activity Transitions: ${taskSessions.length}
- Total Activities Recorded: ${predictions.length}

**Time Spent by Application:**
${Object.entries(appTimeMap)
  .sort(([, a], [, b]) => b - a)
  .map(([app, time]) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const percentage = ((time / video_info.duration_seconds) * 100).toFixed(1);
    return `- ${app}: ${minutes}m ${seconds}s (${percentage}%)`;
  })
  .join('\n')}

**Top 10 Longest Task Sessions:**
${topSessions
  .map((session, idx) => {
    const minutes = Math.floor(session.duration / 60);
    const seconds = Math.floor(session.duration % 60);
    const startMin = Math.floor(session.startTime / 60);
    const startSec = Math.floor(session.startTime % 60);
    return `${idx + 1}. [${startMin}:${startSec.toString().padStart(2, '0')}] ${session.app} - ${session.action} (${minutes}m ${seconds}s)`;
  })
  .join('\n')}

**Activity Distribution:**
${Object.entries(summary.app_distribution)
  .sort(([, a], [, b]) => b - a)
  .map(([app, count]) => `- ${app}: ${count} activity chunks`)
  .join('\n')}

Based on this workflow data, provide:

1. **Workflow Summary**
   - What was the user primarily working on during this session?
   - Describe the main workflow pattern (focused work vs. multitasking)
   - Were there clear phases or stages in the work?

2. **Time Allocation Analysis**
   - Break down how time was spent across different applications
   - Identify the most time-consuming activities
   - Calculate approximate focused work time vs. context switching time

3. **Task Progression**
   - Describe the chronological flow of work
   - Identify any patterns in how tasks were sequenced
   - Note any significant transitions or breaks

4. **Productivity Observations**
   - Was the session focused or fragmented?
   - How many context switches occurred?
   - Were there periods of sustained focus on a single task?

5. **Work Session Insights**
   - Estimate the effective working time
   - Identify potential distractions or interruptions
   - Note the balance between different types of activities

Write in a clear, analytical tone. Use specific time durations and percentages. Format the report with clear sections and bullet points for readability.`;
}

export const LLMService = {
  generateReport,
  generateReportStream,
};
