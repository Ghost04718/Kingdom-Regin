// src/constants/chainConstants.js

export const CHAIN_TYPES = {
    DIPLOMATIC: 'DIPLOMATIC',
    CRISIS: 'CRISIS',
    OPPORTUNITY: 'OPPORTUNITY',
    QUEST: 'QUEST',
    CONSPIRACY: 'CONSPIRACY'
  };
  
  export const CHAIN_TEMPLATES = {
    DIPLOMATIC: {
      maxSteps: 5,
      trigger: 'Diplomatic Relations',
      initialEvents: [
        {
          title: 'Foreign Envoy Arrives',
          description: 'An envoy from a neighboring kingdom seeks audience.',
          type: 'EXTERNAL',
          choices: [
            {
              text: 'Welcome with full honors',
              impact: { economy: -5, happiness: 5 },
              continueChain: true,
              nextEvent: 'POSITIVE_DIPLOMACY'
            },
            {
              text: 'Maintain formal distance',
              impact: { economy: 0, happiness: 0 },
              continueChain: true,
              nextEvent: 'NEUTRAL_DIPLOMACY'
            },
            {
              text: 'Show minimal courtesy',
              impact: { economy: 5, happiness: -5 },
              continueChain: true,
              nextEvent: 'NEGATIVE_DIPLOMACY'
            }
          ]
        }
      ],
      eventPool: {
        POSITIVE_DIPLOMACY: [
          {
            title: 'Alliance Proposal',
            description: 'The foreign kingdom proposes a formal alliance.',
            type: 'EXTERNAL',
            choices: [
              {
                text: 'Accept alliance',
                impact: { economy: 10, military: 10, happiness: 5 },
                continueChain: true
              },
              {
                text: 'Request better terms',
                impact: { economy: -5, military: 0, happiness: 0 },
                continueChain: true
              }
            ]
          }
        ],
        NEUTRAL_DIPLOMACY: [
          {
            title: 'Trade Negotiations',
            description: 'The envoy presents trade proposals.',
            type: 'EXTERNAL',
            choices: [
              {
                text: 'Accept trade deal',
                impact: { economy: 15, happiness: 5, military: -5 },
                continueChain: true
              },
              {
                text: 'Counter-offer',
                impact: { economy: 5, happiness: 0, military: 0 },
                continueChain: true
              }
            ]
          }
        ],
        NEGATIVE_DIPLOMACY: [
          {
            title: 'Rising Tensions',
            description: 'The envoy takes offense at your reception.',
            type: 'EXTERNAL',
            choices: [
              {
                text: 'Attempt to smooth relations',
                impact: { economy: -10, happiness: -5, military: 0 },
                continueChain: true
              },
              {
                text: 'Stand firm',
                impact: { economy: -5, happiness: 0, military: 10 },
                continueChain: true
              }
            ]
          }
        ]
      }
    },
    CRISIS: {
      maxSteps: 4,
      trigger: 'Internal Crisis',
      initialEvents: [
        {
          title: 'Noble Uprising',
          description: 'Several powerful nobles challenge your authority.',
          type: 'INTERNAL',
          choices: [
            {
              text: 'Negotiate with rebels',
              impact: { economy: -10, happiness: 5, military: 0 },
              continueChain: true,
              nextEvent: 'PEACEFUL_RESOLUTION'
            },
            {
              text: 'Show military might',
              impact: { economy: -5, happiness: -10, military: -5 },
              continueChain: true,
              nextEvent: 'MILITARY_CONFLICT'
            }
          ]
        }
      ],
      eventPool: {
        PEACEFUL_RESOLUTION: [
          {
            title: 'Noble Demands',
            description: 'The nobles present their terms.',
            type: 'INTERNAL',
            choices: [
              {
                text: 'Accept demands',
                impact: { economy: -15, happiness: 10, military: 0 },
                continueChain: true
              },
              {
                text: 'Counter-offer',
                impact: { economy: -10, happiness: 5, military: 0 },
                continueChain: true
              }
            ]
          }
        ],
        MILITARY_CONFLICT: [
          {
            title: 'Battle Lines Drawn',
            description: 'The nobles gather their forces.',
            type: 'INTERNAL',
            choices: [
              {
                text: 'Launch pre-emptive strike',
                impact: { economy: -10, happiness: -15, military: -10 },
                continueChain: true
              },
              {
                text: 'Defend strategic positions',
                impact: { economy: -5, happiness: -10, military: -5 },
                continueChain: true
              }
            ]
          }
        ]
      }
    }
  };
  
  export function getInitialChainEvent(chainType) {
    const template = CHAIN_TEMPLATES[chainType];
    if (!template?.initialEvents?.length) {
      throw new Error(`No initial events found for chain type: ${chainType}`);
    }
    
    return template.initialEvents[
      Math.floor(Math.random() * template.initialEvents.length)
    ];
  }
  
  export function getNextChainEvent(chainType, nextEventKey) {
    const template = CHAIN_TEMPLATES[chainType];
    if (!template?.eventPool?.[nextEventKey]?.length) {
      throw new Error(`No events found for key: ${nextEventKey}`);
    }
    
    return template.eventPool[nextEventKey][
      Math.floor(Math.random() * template.eventPool[nextEventKey].length)
    ];
  }