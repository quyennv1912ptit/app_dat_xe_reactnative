import { forwardRef, useImperativeHandle, useLayoutEffect, useRef, useState, type ComponentPropsWithRef, type ComponentRef, type ComponentType } from "react";
import { Platform, StyleSheet, TextInput, type TextInputProps } from "react-native";

export type DraftTextInputProps = TextInputProps & {
  /** Mirror a draft for validation and intentional resets without controlling the native editor. */
  draftValue?: string;
  /** Native input adapter for containers that coordinate keyboard focus. */
  inputComponent?: ComponentType<ComponentPropsWithRef<typeof TextInput>>;
};

/**
 * On iOS, setting lineHeight on a single-line UITextField shifts the text baseline
 * downward instead of vertically centering it inside the input box.
 */
function normalizeIosSingleLineStyle(style: TextInputProps["style"]): TextInputProps["style"] {
  const flat = StyleSheet.flatten(style);
  if (!flat || !("lineHeight" in flat)) return style;
  const normalized = { ...flat };
  delete normalized.lineHeight;
  return normalized;
}

export const NativeDraftTextInput = forwardRef<ComponentRef<typeof TextInput>, DraftTextInputProps>(
  function NativeDraftTextInput({ draftValue, defaultValue, onChangeText, inputComponent: Input = TextInput, style, ...props }, ref) {
    const input = useRef<ComponentRef<typeof TextInput>>(null);
    const [initial] = useState(() => draftValue ?? defaultValue);
    const nativeText = useRef(initial);
    useImperativeHandle(ref, () => input.current!, []);

    useLayoutEffect(() => {
      const editor = input.current;
      if (!editor || draftValue === undefined || draftValue === nativeText.current) return;
      // A draft echoed from onChangeText already lives in the IME. Only write
      // to the editor on an external change, such as clearing a sent message.
      nativeText.current = draftValue;
      if (draftValue === "") editor.clear();
      else if (Platform.OS === "web") {
        (editor as unknown as HTMLInputElement | HTMLTextAreaElement).value = draftValue;
      } else editor.setNativeProps({ text: draftValue });
    }, [draftValue]);

    const resolvedStyle =
      Platform.OS === "ios" && !props.multiline ? normalizeIosSingleLineStyle(style) : style;

    return (
      <Input
        {...props}
        style={resolvedStyle}
        ref={input}
        defaultValue={initial}
        onChangeText={(text) => {
          nativeText.current = text;
          onChangeText?.(text);
        }}
      />
    );
  },
);
