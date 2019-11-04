import Router from "koa-better-router";

export function setupKoaService(koaService) {
  const router = Router({
    notFound: async (ctx, next) => {
      console.log("route not found", ctx.request.url);
      return next();
    }
  });

  router.addRoute("GET", "/hello", async (ctx, next) => {
    ctx.body = "hello world";
    return next();
  });

  koaService.koa.use(router.middleware());
}
