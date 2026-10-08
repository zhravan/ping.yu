import { handleApi } from "./api";
import {
  processProbe,
  queueActiveMonitors,
  syncPendingMeasurements,
} from "./measurements";
import type { Env } from "./types";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const response = await handleApi(request, env);

    return response ?? env.ASSETS.fetch(request);
  },

  async scheduled(
    _controller: ScheduledController,
    env: Env,
  ): Promise<void> {
    await syncPendingMeasurements(env);
    await queueActiveMonitors(env);
  },

  async queue(
    batch: MessageBatch<{ monitorId: string }>,
    env: Env,
  ): Promise<void> {
    for (const message of batch.messages) {
      const result = await processProbe(env, message.body.monitorId);

      if (result === "ack") {
        message.ack();
      } else {
        message.retry();
      }
    }
  },
};
