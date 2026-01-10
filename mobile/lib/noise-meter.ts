export class NoiseMeter {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;
  private dataArray: Uint8Array | null = null;
  private animationFrameId: number | null = null;

  private readonly NOISE_THRESHOLD_DB = 50;

  async start(): Promise<boolean> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.8;

      this.microphone = this.audioContext.createMediaStreamSource(this.stream);
      this.microphone.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);

      return true;
    } catch (error) {
      console.error('Error accessing microphone:', error);
      return false;
    }
  }

  getNoiseLevel(): number {
    if (!this.analyser || !this.dataArray) {
      return 0;
    }

    const bufferLength = this.analyser.frequencyBinCount;
    const buffer = new Uint8Array(new ArrayBuffer(bufferLength));
    this.analyser.getByteFrequencyData(buffer);

    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
      sum += buffer[i] * buffer[i];
    }
    const rms = Math.sqrt(sum / buffer.length);

    const db = 20 * Math.log10(rms / 255) + 96;
    
    return Math.max(0, Math.min(96, db));
  }

  isNoiseDetected(): boolean {
    return this.getNoiseLevel() >= this.NOISE_THRESHOLD_DB;
  }

  startMonitoring(
    onUpdate: (db: number, isNoise: boolean) => void
  ): void {
    if (this.animationFrameId !== null) {
      this.stopMonitoring();
    }

    const update = () => {
      const db = this.getNoiseLevel();
      const isNoise = this.isNoiseDetected();
      onUpdate(db, isNoise);
      this.animationFrameId = requestAnimationFrame(update);
    };

    update();
  }

  stopMonitoring(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  stop(): void {
    this.stopMonitoring();

    if (this.microphone) {
      this.microphone.disconnect();
      this.microphone = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    this.analyser = null;
    this.dataArray = null;
  }

  getThreshold(): number {
    return this.NOISE_THRESHOLD_DB;
  }
}
