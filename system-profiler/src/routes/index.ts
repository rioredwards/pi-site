import { Hono } from "hono";
import { health } from "./health.js";
import { stats } from "./stats.js";
import { host } from "./host.js";
import { containers } from "./containers.js";
import { services } from "./services.js";

const routes = new Hono();

routes.route("/health", health);
routes.route("/stats", stats);
routes.route("/host", host);
routes.route("/containers", containers);
routes.route("/services", services);

export { routes };
