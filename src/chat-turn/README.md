# Chat Turn Node

This node owns the full backend conversational turn inside the standalone Agent Talk repo.

## Public Entry

- `index.js`

## Inputs

- transcript text
- optional voice
- optional session id
- `edgeTtsService`
- `sessionStore`

## Outputs

- normalized JSON-ready reply payload with `replyText`, `voice`, `audioUrl`, `sessionId`, and `mode`

## Dependency Rule

- Adapters may call this node.
- This node may call `audio`, `conversation`, and `sessions`.
- No other node should reach into this node's private helper files.
