'use client';

import { DualSoundBarProgress } from './DualSoundBarProgress';

interface Props {
  currentReading: number;
  max: number;
  min: number;
  avg: number;
  time: string;
  paused?: boolean;
}

export function DecibelDisplay({ currentReading, max, min, avg, time, paused = false }: Props) {
  return (
    <div className="w-full flex flex-col items-center bg-white p-3 rounded-lg shadow-md max-w-[320px] mx-auto">
      <div className="flex justify-between w-full px-6 mb-2">
        <div className="flex flex-col items-start">
          <div className="text-xs font-bold text-black">MAX</div>
          <div className="text-sm text-black">{Math.round(max)}</div>
        </div>
        <div className="flex flex-col items-end">
          <div className="text-xs font-bold text-black">{paused ? 'Restart' : 'AVG'}</div>
          {paused ? (
            <div className="rounded-full p-1 text-red-900">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
          ) : (
            <div className="text-sm text-black">{Math.round(avg)}</div>
          )}
        </div>
      </div>

      <div className="relative w-[210px] h-[210px] mt-[-20px]">
        <div className="relative rounded-full bg-[#9faec8] border-[3px] border-[#cfd6db] w-fit h-fit">
          <div className="p-[2px]">
            <img src="/meter.svg" alt="base-frame" className="w-[210px] h-[210px] block" />
          </div>

          <div className="absolute left-0 top-0 z-[1] p-[2.5px] mt-[0.2px]">
            <img src="/volumebase.svg" alt="volume-base" className="w-[210px] h-[210px] block" />
          </div>

          <DualSoundBarProgress currentReading={currentReading} />

          <div className="absolute left-0 top-[-1px] z-[3] p-[2px] mt-[2.85px] ml-[-0.1px]">
            <img src="/meter.svg" alt="meter-overlay" className="w-[210px] h-[210px] block" />
          </div>
        </div>

        <div className="absolute w-full z-[3] top-0 text-center">
          <div className="text-sm font-bold mt-[2px] ml-[-4px] text-black">100</div>
        </div>

        <div className="absolute w-full z-[3] bottom-0 text-center">
          <div className="text-sm font-bold mb-[4px] ml-[4px] text-black">0</div>
        </div>

        <div className="absolute top-[53%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[155px] h-[155px] flex flex-col items-center justify-center mt-[-6px]">
          <div className="h-full w-full rounded-full bg-gray-100 flex justify-center flex-col items-center p-[2px] shadow-inner">
            <div className="text-[10px] text-gray-500 mb-1">Over</div>

            <div className="my-[4px] w-[95px] h-[95px] rounded-full bg-[#e5eaed] border border-[#aec4cd] flex flex-col items-center justify-center font-bold text-2xl p-4">
              <div className="rounded-full h-full w-full flex items-center justify-center bg-[rgba(255,255,255,0.3)] backdrop-blur-[10px] border border-[rgba(255,255,255,0.3)] shadow-[inset_0_2px_8px_rgba(255,255,255,0.5),inset_0_-2px_4px_rgba(0,0,0,0.1)]">
                {Math.round(currentReading)}
              </div>
            </div>

            <div className="text-[10px] text-gray-500 mt-1">
              dB-A {paused && 'AVG'}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-[-32px] w-full px-6">
        <div className="flex flex-col items-start">
          <div className="text-xs font-bold text-black">MIN</div>
          <div className="text-sm text-black">{Math.round(min)}</div>
        </div>
        <div className="flex flex-col items-end">
          <div className="text-xs font-bold text-black">TIME</div>
          <div className="text-sm text-black">{time}</div>
        </div>
      </div>
    </div>
  );
}
