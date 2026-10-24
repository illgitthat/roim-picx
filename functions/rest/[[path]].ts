import { error } from 'itty-router';

export interface Env {
  AUTH_TOKEN: string
  COPY_URL: string
  R2: R2Bucket
}

export const onRequest: PagesFunction<Env> = async (context : EventContext) => {
  const { router } = await import('./router').then(
    async (module) => (await import('./routes'), module)
  );

  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const response: Response | undefined = await router.fetch(context.request, context.env);
    return response ?? error(404, 'not found');
  } catch (err) {
    return error(500, (err as Error).message);
  }
};
