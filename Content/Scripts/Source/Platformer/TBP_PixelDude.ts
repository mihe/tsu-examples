import { BP_PixelDude } from 'UE/BP_PixelDude';
import { Vector } from 'UE/Vector';

export function construct(target: BP_PixelDude) {
	target.initialCharacterTransform = target.getActorTransform();
}

export function onInput(target: BP_PixelDude, right: number, up: number) {
	if (target.deactivate) { return; }

	if (right !== 0) {
		target.addMovementInput(new Vector(1, 0, 0), right);
	}

	if (up > 0) {
		target.jump();
		target.characterBody.setStaticMesh(target.meshJumping);
	}
}

export function onLanded(target: BP_PixelDude) {
	target.characterBody.setStaticMesh(target.meshDefault);
}

export function onQuitGame(target: BP_PixelDude) {
	target.deactivate = true;
	target.characterBody.setStaticMesh(target.meshDefault);
	target.setActorTransform(target.initialCharacterTransform);
}
