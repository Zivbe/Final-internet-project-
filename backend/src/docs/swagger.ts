import swaggerJsdoc from "swagger-jsdoc";

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Fullstack App API",
      version: "0.1.0"
    }
  },
  apis: ["./src/routes/**/*.ts"]
});
