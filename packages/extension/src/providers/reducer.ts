import type {
  InitMessage,
  Message,
  ReplayMessage,
  NetworkChangedMessage,
  BlockNumberChangedMessage,
  CallsChangedMessage,
  MulticallSuccessMessage,
  MulticallErrorMessage,
} from './Message'
import type { State } from './State'

export const INITIAL_STATE: State = {
  currentNetwork: undefined,
  calls: [],
  events: [],
}

export function reducer(state: State, message: Message) {
  switch (message.payload.type) {
    case 'REPLAY':
      return replay(state, message as ReplayMessage)
    case 'INIT':
      return init(state, message as InitMessage)
    case 'NETWORK_CHANGED':
      return networkChanged(state, message as NetworkChangedMessage)
    case 'BLOCK_NUMBER_CHANGED':
      return blockNumberChanged(state, message as BlockNumberChangedMessage)
    case 'CALLS_CHANGED':
      return callsChanged(state, message as CallsChangedMessage)
    case 'MULTICALL_SUCCESS':
      return multicallSuccess(state, message as MulticallSuccessMessage)
    case 'MULTICALL_ERROR':
      return multicallError(state, message as MulticallErrorMessage)
    default:
      return state
  }
}

function replay(state: State, message: ReplayMessage) {
  let newState = state
  for (const hookMessage of message.payload.messages) {
    newState = reducer(newState, hookMessage)
  }
  return newState
}

function init(state: State, message: InitMessage): State {
  return {
    ...INITIAL_STATE,
    events: [
      {
        type: 'INIT',
        time: timestampToTime(message.timestamp),
      },
    ],
  }
}

function networkChanged(state: State, message: NetworkChangedMessage): State {
  if (message.payload.chainId === undefined) {
    if (state.currentNetwork === undefined) {
      return state
    }
    return {
      ...state,
      currentNetwork: undefined,
      events: [
        ...state.events,
        {
          type: 'NETWORK_DISCONNECTED',
          time: timestampToTime(message.timestamp),
        },
      ],
    }
  }

  const network = chainIdToNetwork(message.payload.chainId)
  if (state.currentNetwork === network) {
    return state
  }

  return {
    ...state,
    currentNetwork: undefined,
    events: [
      ...state.events,
      {
        type: 'NETWORK_CONNECTED',
        network,
        time: timestampToTime(message.timestamp),
      },
    ],
  }
}

function blockNumberChanged(state: State, message: BlockNumberChangedMessage): State {
  const network = chainIdToNetwork(message.payload.chainId)
  return {
    ...state,
    events: [
      ...state.events,
      {
        type: 'BLOCK_FOUND',
        network,
        time: timestampToTime(message.timestamp),
        blockNumber: message.payload.blockNumber,
      },
    ],
  }
}

function callsChanged(state: State, message: CallsChangedMessage): State {
  // TODO: this
  return state
}

function multicallSuccess(state: State, message: MulticallSuccessMessage): State {
  // TODO: this
  return state
}

function multicallError(state: State, message: MulticallErrorMessage): State {
  // TODO: this
  return state
}

function timestampToTime(timestamp: number) {
  const date = new Date(timestamp)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const seconds = date.getSeconds().toString().padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

function chainIdToNetwork(chainId: number) {
  switch (chainId) {
    case 1:
      return 'Mainnet'
    case 3:
      return 'Ropsten'
    case 4:
      return 'Rinkeby'
    case 5:
      return 'Goerli'
    case 42:
      return 'Kovan'
    case 100:
      return 'xDai'
    case 1337:
      return 'Localhost'
    case 31337:
      return 'Hardhat'
    default:
      return chainId.toString()
  }
}
