import { AIIntent, AIContext, AIConfidence, AIError } from '../types/index.js';
import { EntityExtractor } from './entity-extractor.js';
import { IntentClassifier } from './intent-classifier.js';
import { ContextAnalyzer } from './context-analyzer.js';

export class NLPProcessor {
    private entityExtractor: EntityExtractor;
    private intentClassifier: IntentClassifier;
    private contextAnalyzer: ContextAnalyzer;

    constructor() {
        this.entityExtractor = new EntityExtractor();
        this.intentClassifier = new IntentClassifier();
        this.contextAnalyzer = new ContextAnalyzer();
    }

    async processCommand(
        input: string,
        context: AIContext
    ): Promise<{
        intent: AIIntent;
        confidence: AIConfidence;
        error?: AIError;
    }> {
        try {
            // Extract entities from the input
            const entities = await this.entityExtractor.extract(input);

            // Classify the intent
            const intent = await this.intentClassifier.classify(input, entities);

            // Create preliminary intent for context analysis
            const preliminaryIntent: AIIntent = {
                action: intent.action,
                target: entities.primary_target,
                parameters: { ...entities.parameters, ...intent.parameters },
                raw_input: input
            };

            // Analyze context relevance
            const contextRelevance = await this.contextAnalyzer.analyze(preliminaryIntent, context);

            // Calculate confidence scores
            const confidence: AIConfidence = {
                overall: (intent.confidence + entities.confidence + contextRelevance.confidence) / 3,
                intent: intent.confidence,
                entities: entities.confidence,
                context: contextRelevance.confidence
            };

            // Create structured intent
            const structuredIntent: AIIntent = {
                action: intent.action,
                target: entities.primary_target,
                parameters: {
                    ...entities.parameters,
                    ...intent.parameters,
                    context_parameters: contextRelevance.relevant_params
                },
                raw_input: input
            };

            return {
                intent: structuredIntent,
                confidence
            };
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            return {
                intent: {
                    action: 'error',
                    target: 'system',
                    parameters: {},
                    raw_input: input
                },
                confidence: {
                    overall: 0,
                    intent: 0,
                    entities: 0,
                    context: 0
                },
                error: {
                    code: 'NLP_PROCESSING_ERROR',
                    message: errorMessage,
                    suggestion: 'Please try rephrasing your command',
                    recovery_options: [
                        'Use simpler language',
                        'Break down the command into smaller parts',
                        'Specify the target device explicitly'
                    ],
                    context
                }
            };
        }
    }

    async validateIntent(
        intent: AIIntent,
        confidence: AIConfidence,
        threshold = 0.7
    ): Promise<boolean> {
        return (
            confidence.overall >= threshold &&
            confidence.intent >= threshold &&
            confidence.entities >= threshold &&
            confidence.context >= threshold
        );
    }

    async suggestCorrections(
        input: string,
        error: AIError
    ): Promise<string[]> {
        // Implement correction suggestions based on the error
        const suggestions: string[] = [];

        if (error.code === 'ENTITY_NOT_FOUND') {
            suggestions.push(
                'Try specifying the device name more clearly',
                'Use the exact device name from your Home Assistant setup'
            );
        }

        if (error.code === 'AMBIGUOUS_INTENT') {
            suggestions.push(
                'Please specify what you want to do with the device',
                'Use action words like "turn on", "set", "adjust"'
            );
        }

        if (error.code === 'CONTEXT_MISMATCH') {
            suggestions.push(
                'Specify the location if referring to a device',
                'Clarify which device you mean in the current context'
            );
        }

        return suggestions;
    }
} 