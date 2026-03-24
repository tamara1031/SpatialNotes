import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
	LexicalTypeaheadMenuPlugin,
	MenuOption,
	useBasicTypeaheadTriggerMatch,
} from "@lexical/react/LexicalTypeaheadMenuPlugin";
import { useCallback } from "react";

class SlashOption extends MenuOption {
	title: string;
	constructor(title: string) {
		super(title);
		this.title = title;
	}
}

const OPTIONS = [
	new SlashOption("Heading 1"),
	new SlashOption("Heading 2"),
	new SlashOption("Table"),
	new SlashOption("Image"),
	new SlashOption("LaTeX"),
];

export function SlashCommandPlugin() {
	const [editor] = useLexicalComposerContext();
	const onSelectOption = useCallback(
		(_option: SlashOption) => {
			editor.update(() => {
				// Handle insertion logic here
			});
		},
		[editor],
	);

	const checkForSlash = useBasicTypeaheadTriggerMatch("/", {
		minLength: 0,
	});

	return (
		<LexicalTypeaheadMenuPlugin<SlashOption>
			onQueryChange={() => {}}
			onSelectOption={onSelectOption}
			triggerFn={checkForSlash}
			options={OPTIONS}
			menuRenderFn={(
				anchorElementRef,
				{ selectedIndex, selectOptionAndCleanUp, setHighlightedIndex },
			) => {
				if (anchorElementRef.current === null) return null;
				return (
					<div className="slash-menu" role="menu">
						<ul>
							{OPTIONS.map((option, i) => (
								<li
									key={option.key}
									className={selectedIndex === i ? "selected" : ""}
									onClick={() => selectOptionAndCleanUp(option)}
									onMouseEnter={() => setHighlightedIndex(i)}
								>
									{option.title}
								</li>
							))}
						</ul>
					</div>
				);
			}}
		/>
	);
}
