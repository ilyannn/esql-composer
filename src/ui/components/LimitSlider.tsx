import {
  Slider,
  SliderMark,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  HStack,
  Spacer,
} from "@chakra-ui/react";
import React, { useCallback } from "react";
import { BsInfoSquare } from "react-icons/bs";
import SpinningButton from "./SpinningButton";

interface LimitSliderProps {
  limit: number | null;
  onChange: (limit: number | null) => void;
  onShowLimitSettings: () => Promise<void>;
  sliderValues: ReadonlyArray<number>;
}

const LimitSlider: React.FC<LimitSliderProps> = ({
  limit,
  onChange,
  onShowLimitSettings,
  sliderValues,
}) => {
  const toSliderValue = useCallback(
    (limit: number | null) => {
      if (limit === null || limit > sliderValues[sliderValues.length - 1]) {
        return sliderValues.length;
      } else {
        return sliderValues.findIndex((stop) => stop >= limit);
      }
    },
    [sliderValues],
  );

  return (
    <HStack spacing={8} align="center" justify="stretch">
      <Spacer flex={0} />
      <Slider
        aria-label="Query limit"
        value={toSliderValue(limit)}
        max={sliderValues.length}
        flex={1}
        onChange={(value) =>
          onChange(value === sliderValues.length ? null : sliderValues[value])
        }
      >
        {[...sliderValues, null].map((value, idx) => (
          <SliderMark
            key={idx}
            value={idx}
            mt=".5em"
            fontSize="xs"
            textAlign="center"
            transform={"translateX(-50%)"}
          >
            {value || "Default"}
          </SliderMark>
        ))}
        <SliderTrack>
          <SliderFilledTrack />
        </SliderTrack>
        <SliderThumb borderColor={"blue.400"} />
      </Slider>
      <SpinningButton
        targets="es"
        size="xs"
        type="button"
        spinningAction={onShowLimitSettings}
        gratisAction
      >
        ?
      </SpinningButton>
    </HStack>
  );
};

export default React.memo(LimitSlider);
