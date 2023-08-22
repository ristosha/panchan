export interface Task {
  // eslint-disable-next-line @typescript-eslint/ban-types
  task: () => void | Promise<void>
  onStep: (position: number, length: number, estimated: number) => void | Promise<void>
  onProcessing: () => void | Promise<void>
  onComplete: () => void | Promise<void>
  onError: (error: any) => void | Promise<void>
}

export class Queue {
  private readonly queue: Task[] = []
  private pendingPromise = false
  private readonly processingTimes: number[] = []

  public enqueue (task: Task): number {
    console.log('ДОБАВЛЯЮ')
    this.queue.push(task)
    void this.dequeue()
    return this.queue.length
  }

  private async dequeue (): Promise<void> {
    if (this.pendingPromise) return
    console.log('ОБРАБАТЫВАЮ')

    const task = this.queue.shift()
    if (task == null) return

    this.pendingPromise = true

    const startTime = Date.now()

    if (this.queue.length > 0) {
      await Promise.all(this.queue.map(async (t, pos, q) => { await t.onStep(pos, q.length, this.calculateEstimatedTime(pos)) }))
    }

    try {
      await task.onProcessing()
      await task.task()
    } catch (e: any) {
      await task.onError(e)
    } finally {
      const endTime = Date.now()
      const processingTime = endTime - startTime
      this.processingTimes.push(processingTime)
      if (this.processingTimes.length > 30) {
        this.processingTimes.shift()
      }
      this.pendingPromise = false
      await task.onComplete()
      await this.dequeue()
    }
  }

  calculateEstimatedTime (currentPosition: number): number {
    if (this.processingTimes.length === 0) {
      return 0
    }

    const averageTime =
      this.processingTimes.reduce((sum, time) => sum + time, 0) / this.processingTimes.length

    //  const remainingTasks = this.queue.length - currentPosition
    let remainingTime = (averageTime * currentPosition) / 1000
    if (remainingTime <= 0) remainingTime = 1

    return remainingTime
  }

  public length (): number {
    return this.queue.length
  }

  public isPending (): boolean {
    return this.pendingPromise
  }
}

export class QueueManager {
  private readonly queues: Map<string, Queue>

  constructor () {
    this.queues = new Map()
  }

  getQueue (name?: string) {
    const queueName = name ?? 'default'
    if (!this.queues.has(queueName)) {
      this.queues.set(queueName, new Queue())
    }

    console.log('Getting queue ', queueName)

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this.queues.get(queueName)!
  }
}
