export class Future {

    private promise_: Promise<void>
    private resolve_?: Function
    private reject_?: Function

    constructor() {
        let resolve, reject

        this.promise_ = new Promise((res, rej) => {
            resolve = res
            reject = rej
        })

        this.resolve_ = resolve;
        this.reject_ = reject;
    }

    public wait() {
        return this.promise_
    }

    public complete() {
        if (this.resolve_) {
            this.resolve_();
        }
    }

    public error(message?: string) {
        if (this.reject_) {
            if (message) {
                this.reject_(message)
            } else {
                this.reject_()
            }
        }
    }
}