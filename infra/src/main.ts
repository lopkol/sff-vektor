import * as pulumi from "@pulumi/pulumi";
import * as ovh from "@ovhcloud/pulumi-ovh";
import * as neon from "@pulumi/neon";
import * as pulumiservice from "@pulumi/pulumiservice";
import * as fs from "node:fs";

// Config (sff-vektor namespace)
const config = new pulumi.Config();

// -----------------------------------------------------------------------------
// neon:Project
// -----------------------------------------------------------------------------
const neonProject = new neon.Project(
  "neonProject",
  {
    name: "sff-vektor-backend",
    pgVersion: 18,
    regionId: "aws-eu-central-1",
    // 6 hours of retention (Neon free-tier max)
    historyRetentionSeconds: 21600,
    branch: {
      name: pulumi.getStack(),
      databaseName: "sff-vektor-backend",
      roleName: "sff-vektor-backend",
    },
    defaultEndpointSettings: {
      autoscalingLimitMinCu: 0.25,
      autoscalingLimitMaxCu: 0.25,
      suspendTimeoutSeconds: 0,
    },
    computeProvisioner: "k8s-neonvm",
  },
  {
    additionalSecretOutputs: ["connectionUri"],
    ignoreChanges: [
      "id",
      "orgId",
      "quota",
      "branch.id",
      "databaseName",
      "databaseUser",
      "databaseHost",
      "databaseHostPooler",
      "defaultBranchId",
      "defaultEndpointId",
      "defaultEndpointSettings.id",
    ],
  },
);

// -----------------------------------------------------------------------------
// ovh:Domain:ZoneRecord (api)
// -----------------------------------------------------------------------------
const ovhApiDomain = new ovh.domain.ZoneRecord("ovhApiDomain", {
  fieldtype: "CNAME",
  subdomain: "api.sff-vektor",
  zone: "sylvainmarty.com",
  target: "k0s.sylvainmarty.com.",
  ttl: 60,
});

// -----------------------------------------------------------------------------
// ovh:Domain:ZoneRecord (frontend)
// -----------------------------------------------------------------------------
const ovhFrontendDomain = new ovh.domain.ZoneRecord("ovhFrontendDomain", {
  fieldtype: "CNAME",
  subdomain: "sff-vektor",
  zone: "sylvainmarty.com",
  target: "k0s.sylvainmarty.com.",
  ttl: 60,
});

// -----------------------------------------------------------------------------
// pulumiservice:Environment
// -----------------------------------------------------------------------------
new pulumiservice.Environment("pulumiEnvironment", {
  name: pulumi.getStack(),
  organization: "SylvainMarty",
  project: "sff-vektor",
  yaml: fs.readFileSync(`./pulumi-esc.${pulumi.getStack()}.yaml`, "utf8"),
});

// -----------------------------------------------------------------------------
// ghcr read docker config
// -----------------------------------------------------------------------------
const githubContainerRegistryUsername = config.require(
  "githubContainerRegistryUsername",
);
const githubPatReadContainerRegistry = config.requireSecret(
  "githubPatReadContainerRegistry",
);

const dockerConfigGithubReadContainerLogin = pulumi
  .all([githubContainerRegistryUsername, githubPatReadContainerRegistry])
  .apply(([username, pat]) =>
    Buffer.from(`${username}:${pat}`).toString("base64"),
  );

// -----------------------------------------------------------------------------
// Outputs
// -----------------------------------------------------------------------------
export const dockerConfigGithubReadContainerRegistry =
  dockerConfigGithubReadContainerLogin.apply(
    (auth) => `{"auths":{"ghcr.io":{"auth":"${auth}"}}}`,
  );

export const neonDatabaseUrl = neonProject.connectionUri;

export const apiEndpoint = pulumi.interpolate`https://${ovhApiDomain.subdomain}.${ovhApiDomain.zone}`;
export const frontendEndpoint = pulumi.interpolate`https://${ovhFrontendDomain.subdomain}.${ovhFrontendDomain.zone}`;

// Pass-through config values
export const defaultAdminEmail = config.getSecret("defaultAdminEmail");
export const googleClientId = config.getSecret("googleClientId");
export const googleClientSecret = config.getSecret("googleClientSecret");
export const nextAuthSecret = config.getSecret("nextAuthSecret");
export const molyUsername = config.getSecret("molyUsername");
export const molyPassword = config.getSecret("molyPassword");
