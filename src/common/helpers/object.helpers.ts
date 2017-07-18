export interface SimpleMap<T> { [key: string]: T; }

export function mapToArray<T>(map: SimpleMap<T>) {
  return Object.keys(map).map(key => map[key]);
}
