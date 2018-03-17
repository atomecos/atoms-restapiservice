import { AtomServices } from "atomservices";
import { IProcessContext } from "atomservicescore";
import { HttpApplication, HttpContext, HttpRouter, IComposable } from "atoms-httpcore";

export interface RESTAPIServiceProperties {
  APIAppTool: string;
  RouterTool: string;
  Port: number;
  Routes: { [actionPath: string]: { topic: string; type: string; quality: string; }; };
}

export class RESTAPIService extends AtomServices.Core.Service<RESTAPIServiceProperties> {
  private APIApp: HttpApplication;
  private Router: HttpRouter & IComposable;

  async compose(context: IProcessContext) {
    this.APIApp = await context.toolsets(this.Properties.APIAppTool);
    this.Router = await context.toolsets(this.Properties.RouterTool);

    this.APIApp.setProcessContext(context);
    this.Router.setRoutes(this.Properties.Routes);
    this.Router.set404NotFoundHandler(async (ctx: HttpContext, path: string, next: () => Promise<void>) => {
      console.log("404: ", path);
    });
    this.Router.set500ErrorHandler(async (ctx: HttpContext, error: any, next: () => Promise<void>) => {
      console.log("500: ", error);
    });

    this.APIApp.useCompose(this.Router.toComposing());
  }

  async process(context: IProcessContext) {
    this.APIApp.listen(this.Properties.Port);

    console.log(`Server Running on Port: ${this.Properties.Port}`);
  }
}
