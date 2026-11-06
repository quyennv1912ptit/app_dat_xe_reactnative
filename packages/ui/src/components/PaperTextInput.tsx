import type { ComponentProps } from "react";
import { TextInput } from "react-native-paper";

function EditableTextInput(props: ComponentProps<typeof TextInput>) {
  // Keep keyboard predictions from rewriting an in-progress accented word.
  return <TextInput autoCorrect={false} spellCheck={false} {...props} />;
}

export const PaperTextInput = Object.assign(EditableTextInput, { Icon: TextInput.Icon });
