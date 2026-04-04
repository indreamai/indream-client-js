# @indreamai/client

Official JavaScript/TypeScript client for the [Indream](https://indream.ai/) Open API.

- API docs: [Video Editor API](https://docs.indream.ai)
- Supports Node.js 18+ and Edge runtimes

## Installation

```bash
pnpm add @indreamai/client
```

## Quick Start

```ts
import { IndreamClient } from '@indreamai/client'

const client = new IndreamClient({
  apiKey: process.env.INDREAM_API_KEY!,
})

const created = await client.exports.create({
  editorState,
  ratio: '9:16',
  scale: 0.6,
  fps: 30,
  format: 'mp4',
})

const task = await client.exports.wait(created.taskId)
console.log(task.status, task.outputUrl, task.durationSeconds, task.billedStandardSeconds)
```
