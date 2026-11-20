import { createAudioResource, DAVESession, StreamType } from '@discordjs/voice';
import { openSound, readRoleImage } from './EmbeddedAssets';
import { RoleName } from './enums/RoleName';
import { Sound } from './enums/Sound';

export async function selfCheck(): Promise<void> {
  const pngSignature = Buffer.from('89504e470d0a1a0a', 'hex');
  for (const role of Object.values(RoleName)) {
    const image = await readRoleImage(role);
    if (
      image.length <= pngSignature.length ||
      !image.subarray(0, 8).equals(pngSignature)
    ) {
      throw new Error(`Invalid image for role ${role}.`);
    }
  }

  for (const sound of Object.values(Sound)) {
    const resource = createAudioResource(openSound(sound), {
      inputType: StreamType.OggOpus,
    });
    let hasPacket = false;
    for await (const packet of resource.playStream) {
      if (packet instanceof Uint8Array && packet.byteLength > 0) {
        hasPacket = true;
        break;
      }
    }
    if (!hasPacket) {
      throw new Error(`No Opus audio found for ${sound}.`);
    }
  }

  let keyPackageLength = 0;
  const session = new DAVESession(
    1,
    '100000000000000001',
    '100000000000000002',
    {}
  );
  session.once('keyPackage', (value: Buffer) => {
    keyPackageLength = value.length;
  });
  session.reinit();
  if (keyPackageLength === 0) {
    throw new Error('Discord voice encryption could not be initialized.');
  }
}
