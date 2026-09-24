/** Browser adapter for the official Desktop's leased, sandboxed webview. */
export function createOfficialBrowser(bridge, { document, request, onError, timeoutMs = 30000 }) {
  let guest;
  let lease;
  let closed = false;
  let starting;
  let cancelLoad;
  let unsubscribe;
  let captureExpression;
  const origin = "https://chat.deepseek.com";

  const allowed = (value) => {
    try {
      const url = new URL(value);
      return url.origin === origin && !url.username && !url.password;
    } catch { return false; }
  };
  const ensureOpen = () => {
    if (closed) throw new Error("DeepSeek 网页已关闭。");
  };
  const load = (element, navigate) => new Promise((resolve, reject) => {
    let timer;
    const finish = (error) => {
      clearTimeout(timer);
      element.removeEventListener("dom-ready", ready);
      element.removeEventListener("did-fail-load", failed);
      if (cancelLoad === cancel) cancelLoad = undefined;
      error ? reject(error) : resolve();
    };
    const ready = () => finish();
    const failed = (event) => {
      if (event.isMainFrame && event.errorCode !== -3) {
        finish(new Error("DeepSeek 网页加载失败，请检查网络后重试。"));
      }
    };
    const cancel = () => finish(new Error("DeepSeek 网页已关闭。"));
    cancelLoad = cancel;
    element.addEventListener("dom-ready", ready);
    element.addEventListener("did-fail-load", failed);
    timer = setTimeout(() => finish(new Error("DeepSeek 网页加载超时，请重试。")), timeoutMs);
    try { Promise.resolve(navigate()).catch(finish); } catch (error) { finish(error); }
  });
  const release = async () => {
    cancelLoad?.();
    unsubscribe?.();
    unsubscribe = undefined;
    guest?.remove();
    guest = undefined;
    const current = lease;
    lease = undefined;
    if (current) await bridge.release(current);
  };
  const evaluate = async (expression) => {
    ensureOpen();
    const element = guest;
    if (!element || !allowed(element.getURL())) throw new Error("请先在左侧打开 DeepSeek 对话。");
    // Recheck in the guest as navigation can occur between getURL and execution.
    return element.executeJavaScript(`(() => {
      if (location.origin !== ${JSON.stringify(origin)}) throw new Error("请返回 DeepSeek 对话。");
      return (${expression});
    })()`);
  };
  return {
    async start(container, workspace, reload = false) {
      ensureOpen();
      if (starting) return starting;
      starting = (async () => {
        if (guest) {
          if (reload) await load(guest, () => guest.reload());
          return;
        }
        const reservation = await bridge.acquire(workspace || "specsrelay:deepseek");
        if (closed) { await bridge.release(reservation.lease); ensureOpen(); }
        lease = reservation.lease;
        const element = document.createElement("webview");
        guest = element;
        element.setAttribute("partition", reservation.partition);
        element.setAttribute("src", "about:blank#" + lease);
        element.setAttribute("allowpopups", "");
        element.setAttribute("aria-label", "DeepSeek 网页");
        Object.assign(element.style, { display: "flex", width: "100%", height: "100%" });
        unsubscribe = bridge.onOpenRequested(lease, (url) => {
          if (!closed && allowed(url)) void element.loadURL(url).catch(onError);
        });
        element.addEventListener("render-process-gone", () => {
          if (!closed) {
            void release().catch(onError);
            onError(new Error("DeepSeek 网页已中断，请重试。"));
          }
        });
        await load(element, () => container.append(element));
        ensureOpen();
        await load(element, () => element.loadURL(origin + "/"));
        element.clearHistory();
      })().catch(async (error) => { await release(); throw error; })
        .finally(() => { starting = undefined; });
      return starting;
    },
    async capture() {
      captureExpression ??= (await request("/browser/script")).expression;
      return evaluate(captureExpression);
    },
    send: evaluate,
    async dispose() {
      closed = true;
      await release();
      await starting?.catch(() => {});
    }
  };
}
