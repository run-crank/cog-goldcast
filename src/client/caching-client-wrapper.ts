import { ClientWrapper } from '../client/client-wrapper';
import { promisify } from 'util';

class CachingClientWrapper {
  // cachePrefix is scoped to the specific scenario, request, and requestor
  public cachePrefix = `${this.idMap.scenarioId}${this.idMap.requestorId}${this.idMap.connectionId}`;

  constructor(private client: ClientWrapper, public redisClient: any, public idMap: any) {
    this.redisClient = redisClient;
    this.idMap = idMap;
  }

  // Event aware methods
  // -------------------------------------------------------------------

  public async getEvents() {
    const cachekey = `Goldcast|Events|${this.cachePrefix}`;
    const stored = await this.getCache(cachekey);
    if (stored) {
      return stored;
    }

    const result = await this.client.getEvents();
    if (result) {
      await this.setCache(cachekey, result);
    }
    return result;
  }

  public async getEventRegistrants(id: string) {
    const cachekey = `Goldcast|EventRegistrants|${id}|${this.cachePrefix}`;
    const stored = await this.getCache(cachekey);
    if (stored) {
      return stored;
    }

    const result = await this.client.getEventRegistrants(id);
    if (result) {
      await this.setCache(cachekey, result);
    }
    return result;
  }

  public async getEventMembers(id: string) {
    const cachekey = `Goldcast|EventMembers|${id}|${this.cachePrefix}`;
    const stored = await this.getCache(cachekey);
    if (stored) {
      return stored;
    }

    const result = await this.client.getEventMembers(id);
    if (result) {
      await this.setCache(cachekey, result);
    }
    return result;
  }

  // all non-cached methods, just referencing the original function
  // -------------------------------------------------------------------

  // Redis methods for get, set, and delete
  // -------------------------------------------------------------------

  // Async getter/setter
  public getAsync = promisify(this.redisClient.get).bind(this.redisClient);
  public setAsync = promisify(this.redisClient.setex).bind(this.redisClient);
  public delAsync = promisify(this.redisClient.del).bind(this.redisClient);

  public async getCache(key: string) {
    try {
      const stored = await this.getAsync(key);
      if (stored) {
        return JSON.parse(stored);
      }
      return null;
    } catch (err) {
      console.log(err);
    }
  }

  public async setCache(key: string, value: any) {
    try {
      // arrOfKeys will store an array of all cache keys used in this scenario run
      // so it can be cleared easily
      const arrOfKeys = await this.getCache(`cachekeys|${this.cachePrefix}`) || [];
      arrOfKeys.push(key);
      await this.setAsync(key, 55, JSON.stringify(value));
      await this.setAsync(`cachekeys|${this.cachePrefix}`, 55, JSON.stringify(arrOfKeys));
    } catch (err) {
      console.log(err);
    }
  }

  public async delCache(key: string) {
    try {
      await this.delAsync(key);
    } catch (err) {
      console.log(err);
    }
  }

  public async clearCache() {
    try {
      // clears all the cachekeys used in this scenario run
      const keysToDelete = await this.getCache(`cachekeys|${this.cachePrefix}`) || [];
      if (keysToDelete.length) {
        keysToDelete.forEach(async (key: string) => await this.delAsync(key));
      }
      await this.setAsync(`cachekeys|${this.cachePrefix}`, 55, '[]');
    } catch (err) {
      console.log(err);
    }
  }

}

export { CachingClientWrapper as CachingClientWrapper };
