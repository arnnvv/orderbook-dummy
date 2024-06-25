import { createClient, RedisClientType } from "redis";

const client: RedisClientType = createClient();
client.connect();

export default client;
