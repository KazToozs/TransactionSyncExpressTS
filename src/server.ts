// Preferably using ES6 notation as we're using TypeScript
import App from './app';
import ValidationController from './api/movements/validation/validation.controller';
 
const app = new App(
  [
    new ValidationController(),
  ],
  5000, // Ideally, the port would be dynamic or set as an environment variable 
);

app.listen(() => {
  console.log(`App listening on the port ${app.port}`);
});

// Preferably using ES6 notation as we're using TypeScript
export default app