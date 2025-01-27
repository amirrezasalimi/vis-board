import { type RouteConfig, index, prefix, route } from "@react-router/dev/routes";

export default [index("routes/home.tsx"),
...prefix("board", [
    route(":id", "routes/board.$.tsx"),
]),

] satisfies RouteConfig;
