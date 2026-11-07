/** First acquisition is installation; only replacement of an existing controller is an update. */
export function controllerTracker<T>(initial:T|null){let current=initial;return(next:T|null)=>{const replaced=current!==null&&next!==null&&next!==current;current=next;return replaced;};}
