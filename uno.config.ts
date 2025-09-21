import { defineConfig, presetWind4 } from 'unocss'
import { presetRemToPx } from "@unocss/preset-rem-to-px"

export default defineConfig({
    presets: [
        presetRemToPx({
            baseFontSize: 16
        }),
        presetWind4({
            preflights: {
                theme: 'on-demand',
            },
        }),
    ],
})