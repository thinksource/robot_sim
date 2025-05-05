import { FastifyReply } from 'fastify';

export function errorOutput(error: any, reply: FastifyReply, errorCode: number) {
    if (error instanceof Error) {
        reply.code(errorCode).send({ error: error.message });
    } else {
        reply.code(errorCode).send({ "error" : "Unknown error" });
    }
}