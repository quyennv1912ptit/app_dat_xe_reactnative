import { forwardRef, useImperativeHandle, useLayoutEffect, useRef, useState, type ComponentPropsWithRef, type ComponentType } from "react";
import { Platform, TextInput, type TextInputProps } from "react-native";

export type DraftTextInputProps = TextInputProps & {
  /** Mirror a draft for validation and intentional resets without controlling the native editor. */
  draftValue?: string;
  /** Native input adapter for containers that coordinate keyboard focus. */
  inputComponent?: ComponentType<ComponentPropsWithRef<typeof TextInput>>;
};

export const NativeDraftTextInput = forwardRef<any, DraftTextInputProps>(
  function NativeDraftTextInput({ draftValue, defaultValue, onChangeText, inputComponent: Input = TextInput, ...props }, ref) {
    const input = useRef<any>(null);
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

    return (
      <Input
        {...props}
        ref={input as any}
        defaultValue={initial}
        onChangeText={(text) => {
          nativeText.current = text;
          onChangeText?.(text);
        }}
      />
    );
  },
);
