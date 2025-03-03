# Mobile Food Delivery Backend

## Over view

- This document provides an overview and technical details for the Mobile Food Delivery Backend application, outlining its architecture, features, and implementation. It includes the necessary steps for setting up, running, and deploying the backend, as well as a breakdown of the tools and technologies used in the development process.

## Author

- toan.nguyen <[toan.nguyenhuu@asnet.com.vn](toan.nguyenhuu@asnet.com.vn)>

## Targets

- Design the database
- Understand and create architecture document
- Working with third-party service (Auth0)
- Implement and backend application with Express
- Apply Dependency injection with Node.js, Express.js
- Apply CI/CD with Github
- Docker and Docker Compose on Local development

## Requirements

Authentication

- Sign up new account with Auth0.
- Sign in an existing account with Auth0.

User

- Get list of users
- Get user by id

Dish

- Create dish
- Get list of dishes
- Get dish by id
- Update dish by id
- Delete dish by id

Cart

- Create cart
- Get cart detail
- Add item to cart
- Update item in cart
- Remove item from cart
- Checkout cart

Order

- Create order
- Get list of orders
- Get order by id
- Update order status

## Timeline

- 3 weeks
  - Start day: 04/02/2025
  - End day: 28/02/2025

## Technical stacks

- [Node.js](https://nodejs.org)
- [Typescript](https://www.typescriptlang.org/)
- [Express](https://expressjs.com/)
- [TypeORM](https://typeorm.io/)
- [PostgreSQL](https://www.postgresql.org/)
- [Auth0](https://auth0.com/docs)
- [Jest](https://strapi.io/)
- [Dependency Injection](https://peteranderson.me/articles/dependency-injection-with-nodejs-expressjs-and-typescript)

## Developer tools

- [husky](https://www.npmjs.com/package/husky)
- [prettier](https://storybook.js.org/)
- [eslint](https://eslint.org/)
- [commitlint](https://commitlint.js.org/#/)
- [TypeScript](https://www.typescriptlang.org/)
- [Jest](https://jestjs.io/)
- [Postman](https://www.postman.com/)

## Design on figma:

- Design via [Figma](<https://www.figma.com/design/URAXLmDZAi2EFyGLWrXwE7/Mobile-Food-Delivery-App-(Community)?node-id=3-12&t=2bQBJhMw9ddKnM0s-0>)

## Editor

- Visual Studio Code

## How to run

### Prerequisites

Make sure you install packages with correct version below:

- [node v20.12.0](https://nodejs.org/en/)
- [npm 10.8.1](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)

- **Note:**:
  - Please add `.env` into root of project source code, refer `.env.sample`.

### Get source code

| Command                                                                                 | Action                      |
| :-------------------------------------------------------------------------------------- | :-------------------------- |
| `git clone git@github.com:toannguyenhuu-agilityio/mobile-food-delivery-backend.git`     | Clone Repository with SSH   |
| `git clone https://github.com/toannguyenhuu-agilityio/mobile-food-delivery-backend.git` | Clone Repository with HTTPS |
| `$ cd mobile-food-delivery-backend`                                                     | Redirect to folder          |

### Build and Run app

| Command                   | Action                                | Port                  |
| :------------------------ | :------------------------------------ | :-------------------- |
| `$ npm install`           | Install packages dependencies         | N/A                   |
| `$ npm start`             | Starts the dev server.                | http://localhost:3000 |
| `$ npm run dev`           | Run the app in development mode       | http://localhost:3000 |
| `$ npm run test`          | Run unit test                         | N/A                   |
| `$ npm run test:coverage` | Run unit test with coverage reporting | N/A                   |
