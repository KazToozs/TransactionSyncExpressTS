import * as express from 'express';
import errorMiddleware from './middleware/error.middleware';

class App {
    public app: express.Application;
    public port: number;
    public server;

    constructor(controllers, port) {
        this.app = express();
        this.port = port;

        // Middleware is added in sequentially, in order, so error handling is placed last
        this.initializeMiddlewares();
        this.initializeControllers(controllers);
        this.initializeErrorHandling();
    }

    private initializeMiddlewares() {
        this.app.use(express.json())
    }

    private initializeErrorHandling() {
        this.app.use(errorMiddleware);
    }

    private initializeControllers(controllers) {
        controllers.forEach((controller) => {
            this.app.use('/', controller.router);
        });
    }

    public listen(callback) {
        this.server = this.app.listen(this.port, callback);
    }

    public close(callback) {
        this.server.close(callback);
    }
}

export default App;
