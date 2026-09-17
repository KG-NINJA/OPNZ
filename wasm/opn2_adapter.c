#include <stdint.h>

#include "ym3438.h"

#define OPN2_CLOCKS_PER_NATIVE_SAMPLE 24
#define OPN2_MAX_RENDER_SAMPLES 4096

static ym3438_t chip;
static int16_t output_buffer[OPN2_MAX_RENDER_SAMPLES * 2];
static int initialized = 0;

static void clock_chip(int cycles) {
  int16_t pins[2] = {0, 0};
  for (int i = 0; i < cycles; ++i) {
    OPN2_Clock(&chip, pins);
  }
}

int opnz_init(void) {
  OPN2_SetChipType(ym3438_mode_ym2612);
  OPN2_Reset(&chip);
  initialized = 1;
  return 1;
}

void opnz_reset(void) {
  if (!initialized) {
    opnz_init();
    return;
  }
  OPN2_Reset(&chip);
}

void opnz_write(int port, int address, int value) {
  if (!initialized) {
    opnz_init();
  }
  const int bus = (port & 1) ? 2 : 0;
  OPN2_Write(&chip, (Bit32u)bus, (Bit8u)(address & 0xff));
  clock_chip(24);
  OPN2_Write(&chip, (Bit32u)(bus + 1), (Bit8u)(value & 0xff));
  clock_chip(24);
}

int opnz_render(int sample_count) {
  if (!initialized) {
    opnz_init();
  }
  if (sample_count < 0) {
    return 0;
  }
  if (sample_count > OPN2_MAX_RENDER_SAMPLES) {
    sample_count = OPN2_MAX_RENDER_SAMPLES;
  }

  for (int sample = 0; sample < sample_count; ++sample) {
    int32_t left = 0;
    int32_t right = 0;
    for (int cycle = 0; cycle < OPN2_CLOCKS_PER_NATIVE_SAMPLE; ++cycle) {
      int16_t pins[2] = {0, 0};
      OPN2_Clock(&chip, pins);
      left += pins[0];
      right += pins[1];
    }
    output_buffer[sample * 2] =
        (int16_t)(left / OPN2_CLOCKS_PER_NATIVE_SAMPLE);
    output_buffer[sample * 2 + 1] =
        (int16_t)(right / OPN2_CLOCKS_PER_NATIVE_SAMPLE);
  }
  return sample_count;
}

int opnz_buffer_ptr(void) {
  return (int)(uintptr_t)output_buffer;
}

double opnz_native_rate(void) {
  return 7670454.0 / 144.0;
}
