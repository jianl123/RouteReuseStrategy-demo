import {
  RouteReuseStrategy,
  ActivatedRouteSnapshot,
  DetachedRouteHandle,
  UrlSegment,
} from '@angular/router';

export class SimpleReuseStrategy implements RouteReuseStrategy {
  /*
   * @帮助理解
   * 假设访问了路由 xxx/a 该路由是设置为允许复用(shouldDetach)
   * xxx/a 存入在 store 中
   * shouldReuseRoute 命中, 当再次访问 xxx/a 时, 则该路由是要复用的路由
   * 判断 shouldAttach 是否还原, 可以从 retrieve 中拿到路由快照, 重新构建渲染组件
   */
  static cacheRouters = new Map<string, DetachedRouteHandle>();

  public static deleteRouteCache(url): void {
    if (SimpleReuseStrategy.cacheRouters.has(url)) {
      const handle: any = SimpleReuseStrategy.cacheRouters.get(url);
      try {
        handle.componentRef.destory();
      } catch (e) {}
      SimpleReuseStrategy.cacheRouters.delete(url);
    }
  }

  public static deleteAllRouteCache(): void {
    SimpleReuseStrategy.cacheRouters.forEach((handle: any, key) => {
      SimpleReuseStrategy.deleteRouteCache(key);
    });
  }
  /**
   * 判断当前路由是否需要缓存
   * 这个方法返回false时则路由发生变化并且其余方法会被调用
   * @param {ActivatedRouteSnapshot} future
   * @param {ActivatedRouteSnapshot} curr
   * @returns {boolean}
   * @memberof CacheRouteReuseStrategy
   */

  shouldReuseRoute(
    future: ActivatedRouteSnapshot,
    curr: ActivatedRouteSnapshot
  ): boolean {
    return (
      future.routeConfig === curr.routeConfig &&
      JSON.stringify(future.params) === JSON.stringify(curr.params)
    );
  }

  /**
   * 当离开当前路由时这个方法会被调用
   * 如果返回 true 则 store 方法会被调用
   * @param {ActivatedRouteSnapshot} route
   * @returns {boolean}
   * @memberof CacheRouteReuseStrategy
   */

  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    return Boolean(route.data.keep);
  }
  /**
   * 将路由写入缓存
   * 在这里具体实现如何缓存 RouteHandle
   * 提供了我们离开的路由和 RouteHandle
   * @param {ActivatedRouteSnapshot} route
   * @param {DetachedRouteHandle} detachedTree
   * @memberof CacheRouteReuseStrategy
   */
  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle): void {
    const url = this.getFullRouteURL(route);
    SimpleReuseStrategy.cacheRouters.set(url, handle);
  }
  /**
   * 路由被导航 如果此方法返回 true 则触发 retrieve 方法
   * 如果返回 false 这个组件将会被重新创建
   * @param {ActivatedRouteSnapshot} route
   * @returns {boolean}
   * @memberof CacheRouteReuseStrategy
   */
  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    const url = this.getFullRouteURL(route);
    return (
      Boolean(route.data.keep) && SimpleReuseStrategy.cacheRouters.has(url)
    );
  }
  /**
   * 从缓存读取cached route
   * 提供当前路由的参数（刚打开的路由），并且返回一个缓存的 RouteHandle
   * 可以使用这个方法手动获取任何已被缓存的 RouteHandle
   * @param {ActivatedRouteSnapshot} route
   * @returns {(DetachedRouteHandle | null)}
   * @memberof CacheRouteReuseStrategy
   */

  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle {
    const url = this.getFullRouteURL(route);
    if (route.data.keep && SimpleReuseStrategy.cacheRouters.has(url)) {
      return SimpleReuseStrategy.cacheRouters.get(url);
    } else {
      return null;
    }
  }

  // 获取当前路由url
  private getFullRouteURL(route: ActivatedRouteSnapshot): string {
    const { pathFromRoot } = route;
    let fullRouteUrlPath: string[] = [];
    pathFromRoot.forEach((item: ActivatedRouteSnapshot) => {
      fullRouteUrlPath = fullRouteUrlPath.concat(this.getRouteUrlPath(item));
    });
    return `/${fullRouteUrlPath.join('/')}`;
  }
  private getRouteUrlPath(route: ActivatedRouteSnapshot) {
    return route.url.map((urlSegment) => urlSegment.path);
  }
}
