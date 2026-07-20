# Controller Node

This node owns browser-side orchestration inside the standalone Agent Talk repo.

## Public Entry

- `index.js`

## Inputs

- DOM elements
- voice API loader
- chat transport
- playback function
- recognition factory

## Outputs

- initialized browser controller with `init`, `startListening`, `stopListening`, and `sendTranscript`

## Dependency Rule

- The app bootstrap may call this node.
- This node may call `api`, `audio`, `duplex`, `recognition`, `session`, and `ui`.
- Those leaf nodes must not import this controller.
