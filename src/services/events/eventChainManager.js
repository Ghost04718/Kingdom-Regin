// src/services/events/eventChainManager.js
import { generateClient } from 'aws-amplify/data';
import AIService from '../ai/aiService';

const client = generateClient();

class EventChainManager {
  constructor(kingdomId) {
    if (!kingdomId) {
      throw new Error('Kingdom ID is required for EventChainManager');
    }
    this.kingdomId = kingdomId;
    this.aiService = new AIService();
    this.activeChains = new Map();
  }

  async initializeEventChain(trigger, kingdomState) {
    try {
      const chainId = `chain_${Date.now()}`;
      
      // Initialize chain state
      const chainState = {
        id: chainId,
        trigger,
        currentStep: 0,
        outcomes: [],
        isComplete: false,
        startTime: new Date().toISOString(),
        kingdomId: this.kingdomId
      };

      // Generate first event in chain
      const firstEvent = await this.generateChainEvent(chainState, kingdomState);
      
      // Store chain state
      this.activeChains.set(chainId, {
        ...chainState,
        currentEvent: firstEvent
      });

      return {
        chainId,
        event: firstEvent
      };
    } catch (error) {
      console.error('Error initializing event chain:', error);
      throw error;
    }
  }

  async generateChainEvent(chainState, kingdomState) {
    try {
      // Get event data from AI or fallback system
      let eventData;
      try {
        eventData = await this.aiService.generateChainEvent(chainState, kingdomState);
      } catch (aiError) {
        console.warn('AI chain event generation failed:', aiError);
        eventData = this._generateFallbackChainEvent(chainState, kingdomState);
      }

      // Create event in database
      const event = {
        ...eventData,
        chainId: chainState.id,
        kingdomId: this.kingdomId,
        timestamp: new Date().toISOString(),
        step: chainState.currentStep
      };

      const { data: createdEvent } = await client.models.Event.create(event);
      return createdEvent;
    } catch (error) {
      console.error('Error generating chain event:', error);
      throw error;
    }
  }

  async processChainChoice(chainId, choice, kingdomState) {
    try {
      const chain = this.activeChains.get(chainId);
      if (!chain) {
        throw new Error('Event chain not found');
      }

      // Record outcome
      chain.outcomes.push({
        step: chain.currentStep,
        choice,
        timestamp: new Date().toISOString()
      });

      // Check if chain should continue
      const shouldContinue = this._evaluateChainContinuation(chain, choice);
      
      if (shouldContinue) {
        // Generate next event in chain
        chain.currentStep += 1;
        const nextEvent = await this.generateChainEvent(chain, kingdomState);
        
        // Update chain state
        this.activeChains.set(chainId, {
          ...chain,
          currentEvent: nextEvent
        });

        return {
          isComplete: false,
          nextEvent
        };
      } else {
        // Complete the chain
        chain.isComplete = true;
        chain.endTime = new Date().toISOString();
        
        // Archive chain data if needed
        await this._archiveChain(chain);
        
        // Remove from active chains
        this.activeChains.delete(chainId);

        return {
          isComplete: true,
          summary: this._generateChainSummary(chain)
        };
      }
    } catch (error) {
      console.error('Error processing chain choice:', error);
      throw error;
    }
  }

  _evaluateChainContinuation(chain, lastChoice) {
    // Implement logic to determine if chain should continue
    // Based on number of steps, choice outcomes, etc.
    const maxSteps = 5; // Maximum events in a chain
    
    if (chain.currentStep >= maxSteps) {
      return false;
    }

    // Check if last choice was a "chain ending" choice
    if (lastChoice.endChain) {
      return false;
    }

    // Add more complex continuation logic here
    return true;
  }

  _generateFallbackChainEvent(chainState, kingdomState) {
    // Implement fallback event generation logic
    const templates = [
      {
        title: 'Diplomatic Crisis',
        description: 'The situation with neighboring kingdoms grows tense.',
        type: 'EXTERNAL',
        choices: [
          {
            text: 'Attempt peaceful resolution',
            impact: { economy: -5, happiness: 5 },
            continueChain: true
          },
          {
            text: 'Show military strength',
            impact: { military: 10, happiness: -10 },
            endChain: true
          }
        ]
      },
      // Add more templates...
    ];

    return templates[Math.floor(Math.random() * templates.length)];
  }

  _generateChainSummary(chain) {
    return {
      id: chain.id,
      trigger: chain.trigger,
      steps: chain.currentStep + 1,
      outcomes: chain.outcomes,
      duration: chain.endTime - chain.startTime,
      finalImpact: this._calculateChainImpact(chain.outcomes)
    };
  }

  _calculateChainImpact(outcomes) {
    // Calculate cumulative impact of all choices in chain
    return outcomes.reduce((total, outcome) => {
      const impact = typeof outcome.choice.impact === 'string' 
        ? JSON.parse(outcome.choice.impact) 
        : outcome.choice.impact;
      
      Object.entries(impact).forEach(([stat, value]) => {
        total[stat] = (total[stat] || 0) + value;
      });
      
      return total;
    }, {});
  }

  async _archiveChain(chain) {
    // Implement chain archiving logic
    // Could store in database for history/analytics
    try {
      await client.models.EventChain.create({
        ...chain,
        archiveDate: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error archiving chain:', error);
    }
  }
}

export default EventChainManager;