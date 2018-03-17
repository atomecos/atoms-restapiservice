import { AtomServices } from "atomservices";
import { IProcessContext } from "atomservicescore";
import { HttpApplication, HttpContext, HttpRouter, IComposable } from "atoms-httpcore";

const DefaultAfterPortListening = (port: number) => {
  console.log(`Server Running on Port: ${port}`);
};

export interface RESTAPIServiceProperties {
  APIAppTool: string;
  RouterTool: string;
  Routes: { [actionPath: string]: { topic: string; type: string; quality: string; }; };
  Port?: number;
  AfterPortListening?: (port: number) => void;

  NotFoundRoutingHandler?: (ctx: HttpContext, path: string, next: () => Promise<void>) => Promise<void>;
  ErrorRoutingHandler?: (ctx: HttpContext, path: string, next: () => Promise<void>) => Promise<void>;
}

export class RESTAPIService extends AtomServices.Core.Service<RESTAPIServiceProperties> {
  private APIApp: HttpApplication;
  private Router: HttpRouter & IComposable;
  private Port: number;
  private AfterPortListening: (port: number) => void;

  async compose(context: IProcessContext) {
    this.APIApp = await context.toolsets(this.Properties.APIAppTool);
    this.Router = await context.toolsets(this.Properties.RouterTool);
    this.Port = this.Properties.Port || 3000;
    this.AfterPortListening = this.Properties.AfterPortListening || DefaultAfterPortListening;

    this.APIApp.setProcessContext(context);
    this.Router.setRoutes(this.Properties.Routes);

    if (this.Properties.NotFoundRoutingHandler) {
      this.Router.set404NotFoundHandler(this.Properties.NotFoundRoutingHandler);
    }

    if (this.Properties.ErrorRoutingHandler) {
      this.Router.set500ErrorHandler(this.Properties.ErrorRoutingHandler);
    }

    this.APIApp.useCompose(this.Router.toComposing());
  }

  async process(context: IProcessContext) {
    this.APIApp.listen(this.Properties.Port);
    this.AfterPortListening(this.Port);
  }
}
