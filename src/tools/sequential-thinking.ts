import { z } from 'zod';

const SequentialThinkingInputSchema = z.object({
  thought: z.string().describe("Current thinking step content"),
  thoughtNumber: z.number().int().positive().describe("Current step number (1-based)"),
  totalThoughts: z.number().int().positive().describe("Estimated total steps"),
  nextThoughtNeeded: z.boolean().describe("Whether more thinking is required"),
  isRevision: z.boolean().optional().describe("If this revises a previous thought"),
  revisesThought: z.number().int().positive().optional().describe("Which thought to revise"),
  branchFromThought: z.number().int().positive().optional().describe("Branching point"),
  branchId: z.string().optional().describe("Unique branch identifier"),
});

// 存储思维链
const thinkingSessions = new Map<string, any[]>();

export const sequentialThinkingTool = {
  name: 'sequential_thinking',
  description: 'Record, branch, and revise thinking chains with business context injection',
  inputSchema: SequentialThinkingInputSchema,
  
  invoke: async (input: z.infer<typeof SequentialThinkingInputSchema>) => {
    const sessionId = 'default'; // 简化版本，实际可用UUID
    
    if (!thinkingSessions.has(sessionId)) {
      thinkingSessions.set(sessionId, []);
    }
    
    const session = thinkingSessions.get(sessionId)!;
    
    const thought = {
      id: Date.now().toString(),
      content: input.thought,
      step: input.thoughtNumber,
      totalSteps: input.totalThoughts,
      timestamp: new Date().toISOString(),
      isRevision: input.isRevision || false,
      revisesThought: input.revisesThought,
      branchId: input.branchId,
      businessContext: {
        projectStructure: 'src/, tests/, docs/',
        codingStandards: 'TypeScript strict mode, ESLint, Vitest',
        relevantSnippets: ['// Example: REST API pattern', '// Example: Error handling'],
      }
    };
    
    if (input.isRevision && input.revisesThought) {
      const index = session.findIndex(t => t.step === input.revisesThought);
      if (index !== -1) {
        session[index] = { ...session[index], ...thought };
      }
    } else {
      session.push(thought);
    }
    
    let summary = `Thought #${input.thoughtNumber}/${input.totalThoughts}:\n${input.thought}\n\n`;
    summary += `Business Context:\n- Project: ${thought.businessContext.projectStructure}\n`;
    summary += `- Standards: ${thought.businessContext.codingStandards}\n`;
    summary += `- Next: ${input.nextThoughtNeeded ? 'Continue thinking' : 'Complete'}`;
    
    return {
      content: [
        {
          type: 'text',
          text: summary,
        }
      ],
      thought,
      session: session.slice(-5), // 返回最近5条
    };
  }
};