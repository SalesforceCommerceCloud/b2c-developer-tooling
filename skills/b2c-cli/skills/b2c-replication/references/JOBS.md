# Replication Job Definitions

A `jobs.xml` with one job per replication run. Replace `MySite` with your site ID, and set `target` to `development` to replicate to the development instance.

```
replication-jobs/
└── jobs.xml
```

```xml
<?xml version="1.0" encoding="UTF-8"?>
<jobs xmlns="http://www.demandware.com/xml/impex/jobs/2015-07-01">
    <job job-id="Replicate-Code">
        <description>Transfer and activate the active code version on production</description>
        <parameters/>
        <flow>
            <context site-id="Sites"/>
            <step step-id="ReplicateCode" type="ExecuteCodeReplication" enforce-restart="false">
                <description/>
                <parameters>
                    <parameter name="ReplicationConfiguration">{"code_replication_configuration":{"target":"production","type":"transfer_and_activation","code_version":{"selection":"active"}}}</parameter>
                </parameters>
            </step>
        </flow>
        <rules/>
        <triggers>
            <run-once enabled="false">
                <date>2026-01-01Z</date>
                <time>00:00:00.000Z</time>
            </run-once>
        </triggers>
    </job>
    <job job-id="Replicate-Global">
        <description>Transfer and publish all global data, including site definitions</description>
        <parameters/>
        <flow>
            <context site-id="Sites"/>
            <step step-id="ReplicateGlobal" type="ExecuteDataReplication" enforce-restart="false">
                <description/>
                <parameters>
                    <parameter name="ReplicationConfiguration">{"data_replication_configuration":{"target":"production","type":"transfer_and_publish","description":"Global data","tasks":{"global":{"all":true}}}}</parameter>
                </parameters>
            </step>
        </flow>
        <rules/>
        <triggers>
            <run-once enabled="false">
                <date>2026-01-01Z</date>
                <time>00:00:00.000Z</time>
            </run-once>
        </triggers>
    </job>
    <job job-id="Replicate-MySite">
        <description>Transfer and publish all MySite data (run Replicate-Global first for a new site)</description>
        <parameters/>
        <flow>
            <context site-id="Sites"/>
            <step step-id="ReplicateSite" type="ExecuteDataReplication" enforce-restart="false">
                <description/>
                <parameters>
                    <parameter name="ReplicationConfiguration">{"data_replication_configuration":{"target":"production","type":"transfer_and_publish","description":"MySite data","tasks":{"sites":{"MySite":{"all":true}}}}}</parameter>
                </parameters>
            </step>
        </flow>
        <rules/>
        <triggers>
            <run-once enabled="false">
                <date>2026-01-01Z</date>
                <time>00:00:00.000Z</time>
            </run-once>
        </triggers>
    </job>
</jobs>
```

The disabled `run-once` trigger registers each job for on-demand runs. Replace it with `<run-recurring>` to schedule a job (see `b2c:b2c-custom-job-steps`).

Import and run on staging:

```bash
b2c validate ./replication-jobs
b2c job import ./replication-jobs --show-log
b2c job run Replicate-Code --wait --show-log
b2c job run Replicate-Global --wait --show-log
b2c job run Replicate-MySite --wait --show-log
```

`ExecuteCodeReplication` requires B2C Commerce 26.11 or later. On earlier releases, leave out `Replicate-Code` and replicate code from Business Manager, or with `ExecutePreconfiguredCodeReplicationProcess` and a process defined there.

## Two-Phase Runs

To transfer during the day and publish later, use two jobs: one with `"type":"transfer"` and the tasks, and one with `"type":"publish"`. `publish` reuses the tasks of the most recent transfer to that target, so it ignores `tasks`. Code works the same way with `transfer` and `activation`; `activation` takes no `code_version`.

## Undo

`"type":"undo"` reverts the most recent replication to that target, using its tasks (data). For code, `undo` takes no `code_version`.
