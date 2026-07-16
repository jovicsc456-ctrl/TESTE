import React from 'react';
import { Composition } from 'remotion';
import { MasterComposition } from './MasterComposition';
import { USGDPComposition } from './USGDPComposition';
import { FinanceComposition } from './FinanceComposition';
import { Scene1 } from './scenes/Scene1';
import { Scene2 } from './scenes/Scene2';
import { Scene3 } from './scenes/Scene3';
import { VIDEO, SCENE1, SCENE2, SCENE3, TOTAL_DURATION } from './config';

/**
 * Registra todas as composições:
 *  - MasterComposition: o documentário completo (render final).
 *  - Scene1/2/3: cenas isoladas para preview no Studio.
 */
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MasterComposition"
        component={MasterComposition}
        durationInFrames={TOTAL_DURATION}
        fps={VIDEO.fps}
        width={VIDEO.width}
        height={VIDEO.height}
      />
      <Composition
        id="USGDPComposition"
        component={USGDPComposition}
        durationInFrames={VIDEO.fps * 24}
        fps={VIDEO.fps}
        width={VIDEO.width}
        height={VIDEO.height}
      />
      <Composition
        id="FinanceComposition"
        component={FinanceComposition}
        durationInFrames={VIDEO.fps * 22}
        fps={VIDEO.fps}
        width={VIDEO.width}
        height={VIDEO.height}
      />
      <Composition
        id="Scene1"
        component={Scene1}
        durationInFrames={SCENE1.durationInFrames}
        fps={VIDEO.fps}
        width={VIDEO.width}
        height={VIDEO.height}
      />
      <Composition
        id="Scene2"
        component={Scene2}
        durationInFrames={SCENE2.durationInFrames}
        fps={VIDEO.fps}
        width={VIDEO.width}
        height={VIDEO.height}
      />
      <Composition
        id="Scene3"
        component={Scene3}
        durationInFrames={SCENE3.durationInFrames}
        fps={VIDEO.fps}
        width={VIDEO.width}
        height={VIDEO.height}
      />
    </>
  );
};
