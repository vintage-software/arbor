import { Injectable } from '@angular/core';
import { Headers, Http } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import * as urlTemplate from 'url-template';

const githubApiBaseUrl = 'https://api.github.com/';

interface IPaginationLinks {
  first?: string;
  prev?: string;
  next?: string;
  last?: string;
}

export interface GitHubApiRequestParameters {
  [index: string]: string;
}

@Injectable()
export class GitHubApiService {
  constructor(private http: Http) { }

  get<T>(url: string, accessToken: string, parameters?: GitHubApiRequestParameters): Observable<T> {
    const headers = this.getHeaders(accessToken);

    return this.http.get(this.expandUrl(url, parameters), { headers })
      .switchMap(response => {
        let results = Observable.of(response.json());

        const links = this.parseLinks(response.headers.get('Link'));
        if (links.next) {
          results = Observable.zip(results, this.get(links.next, accessToken), (arr1: any[], arr2: any[]) => arr1.concat(arr2));
        }

        return results;
      });
  }

  getHeaders(accessToken: string) {
    const headers = new Headers();

    headers.set('Authorization', `Bearer ${accessToken}`);

    return headers;
  }

  private expandUrl(url: string, parameters?: GitHubApiRequestParameters) {
    const prefixedUrl = url.startsWith(githubApiBaseUrl) ? url : `${githubApiBaseUrl}${url}`;
    const expandedUrl = urlTemplate.parse(prefixedUrl).expand(parameters || {});

    return expandedUrl;
  }

  private parseLinks(linksHeader: string): IPaginationLinks {
    const links: { [key: string]: string } = {};

    if (linksHeader) {
      for (const link of linksHeader.split(',')) {
        const match = /<(.+)>; rel="(.+)"/.exec(link);
        links[match[2]] = match[1];
      }
    }

    return links;
  }
}
