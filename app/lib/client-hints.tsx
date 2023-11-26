import { getHintUtils } from "@epic-web/client-hints";
import { clientHint as timeZoneHint } from "@epic-web/client-hints/time-zone";

let hintsUtils = getHintUtils({ timeZone: timeZoneHint });

export let { getHints } = hintsUtils;

export function ClientHintCheck() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: hintsUtils.getClientHintCheckScript(),
      }}
    />
  );
}
