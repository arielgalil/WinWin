
import { render } from '@testing-library/react';
import { BackgroundMusic } from '../BackgroundMusic';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

describe('BackgroundMusic', () => {
  beforeEach(() => {
    // Mock YouTube API
    window.YT = {
      Player: vi.fn().mockImplementation(function(id, config) {
        return {
          destroy: vi.fn(),
          setVolume: vi.fn(),
          playVideo: vi.fn(),
          pauseVideo: vi.fn(),
        };
      }),
      PlayerState: {
        ENDED: 0
      }
    };
  });

  it('passes the current origin to the YouTube Player', () => {
    const url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
    render(<BackgroundMusic url={url} isPlaying={true} />);

    // Since YT is already defined in beforeEach, initPlayer should be called immediately
    expect(window.YT.Player).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
      playerVars: expect.objectContaining({
        origin: window.location.origin
      })
    }));
  });

  it('includes enablejsapi: 1 in playerVars', () => {
    const url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
    render(<BackgroundMusic url={url} isPlaying={true} />);

    // This test is expected to FAIL if enablejsapi is missing
    expect(window.YT.Player).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
      playerVars: expect.objectContaining({
        enablejsapi: 1
      })
    }));
  });
});
