import fastify from "fastify";

const server = fastify({ logger: true });

async function main() {
  try {
    await server.listen({ port: 3000, host: "0.0.0.0" });

    console.log(`Server listening`);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

main();
