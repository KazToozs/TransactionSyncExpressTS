// Preferably using ES6 notation as we're using TypeScript
// import App from './app';
import * as express from 'express'
import {StatementSync} from './statementSync'

// Express server
const app = express()

// middleware to parse the request body for JSON input
// app.use(express.urlencoded({ extended: true }));
app.use(express.json())
// import App from './app';
// import PostsController from './posts/posts.controller';
 
// const app = new App(
//   [
//     new PostsController(),
//   ],
//   5000,
// );
 
app.listen();
 
// Routing
app.post("/movements/validation", (request, response) => {
  console.log("Received: ", request.body)

  try {
    const reasons = StatementSync.syncBankStatements(request.body["movements"], request.body["balances"])
    if (reasons == null) {
      response.status(202).send({message: "Accepted"});
    } else {
      response.status(418).send({message: "I'm a teapot", "reasons": reasons});
    }
  } catch (err) {
    response.status(500).send({message: "Server error. Invalid data format?"})
  }

  
});

// Ideally, the port would be dynamic or set as an environment variable 
const server = app.listen(5000, () => console.log(`server started on port 5000`));

// Preferably using ES6 notation as we're using TypeScript
export default server