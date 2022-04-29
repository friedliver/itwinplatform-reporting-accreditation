
import { AbstractWidgetProps, StagePanelLocation, StagePanelSection, UiItemsProvider, WidgetState } from "@itwin/appui-abstract";
import { useActiveIModelConnection } from "@itwin/appui-react";
import { ColorDef, FeatureOverrideType } from "@itwin/core-common";
import { EmphasizeElements, IModelApp, ViewChangeOptions } from "@itwin/core-frontend";
import { ODataItem, Report, ReportingClient } from "@itwin/insights-client";
import { Table } from "@itwin/itwinui-react";
import React, { useEffect, useState, useMemo } from "react";

enum ViewState {
  Reports = 1,
  Entities = 2,
  Data = 3
}

export const ReportingWidget: React.FunctionComponent = () => {
  const itwinId = useActiveIModelConnection()?.iTwinId as string;
  const reportingClientApi = useMemo(() => new ReportingClient(), []);

  const [viewState, setViewState] = useState<ViewState>(ViewState.Reports);
  const [reports, setReports] = useState<Report[]>([]);
  const [activeReport, setActiveReport] = useState<Report>();
  const [entities, setEntities] = useState<ODataItem[]>([]);
  const [activeEntity, setActiveEntity] = useState<ODataItem>();
  const [data, setData] = useState<Record<string, unknown>[]>();

  const reportColumns = useMemo(() => [
    {
      Header: `Reports (${reports?.length})`,
      columns: [
        {
          id: 'displayName',
          Header: 'Name',
          accessor: 'displayName'
        },
        {
          id: 'description',
          Header: 'Description',
          accessor: 'description'
        }
      ]
    }
  ], [reports]);

  const entityColumns = useMemo(() => [
    {
      Header: `OData Entities (${entities?.length})`,
      columns: [
        {
          id: 'name',
          Header: 'Name',
          accessor: 'name'
        },
        {
          id: 'url',
          Header: 'URL',
          accessor: 'url'
        }
      ]
    }
  ], [entities]);

  const dataColumns = useMemo(() => {
    let cols: object[] = [];
    if (data && data.length > 0) {
      cols = Object.keys(data[0]).map((k) => {
        return {
          id: k,
          Header: k,
          accessor: k
        };
      });
    }
    return [
      {
        Header: `Data Rows (${data?.length})`,
        columns: cols,
      },
    ];
  }, [data]);

  const onReportRowClick = async (row: Report) => {
    const report = row as Report;
    const token = await IModelApp?.authorizationClient?.getAccessToken();
    if (token && report?.id) {
      const odataReport = await reportingClientApi.getODataReport(token, report.id);
      setEntities(odataReport.value);
      setActiveReport(report);
      setViewState(ViewState.Entities);
    }
  };

  const onEntityRowClick = async (row: ODataItem) => {
    const entity = row as ODataItem;
    const token = await IModelApp?.authorizationClient?.getAccessToken();
    if (token && entity?.url && activeReport?.id) {
      const data = await reportingClientApi.getODataReportEntity(token, activeReport?.id, entity);
      let rows: Record<string, unknown>[] = [];
      if (data && data?.length > 0) {
        for (var prop of data) {
          let row: Record<string, unknown> = {};
          let keys = Object.keys(prop);
          let values = Object.values(prop);
          for (let i = 0; i < keys.length; i++) {
            row[keys[i]] = values[i];
          }
          rows.push(row);
        }
      }
      setData(rows);
      setActiveEntity(entity);
      setViewState(ViewState.Data);
    }
  };

  const onDataRowClick = async (instanceId: string) => {
    if (instanceId && IModelApp.viewManager.selectedView) {
      const vp = IModelApp.viewManager.selectedView;
      const emph = EmphasizeElements.getOrCreate(vp);

      emph.clearEmphasizedElements(vp);
      emph.clearOverriddenElements(vp);
      emph.overrideElements(
        [instanceId],
        vp,
        ColorDef.red,
        FeatureOverrideType.ColorOnly,
        true
      );
      emph.wantEmphasis = true;
      emph.emphasizeElements([instanceId], vp);
  
      const viewChangeOpts: ViewChangeOptions = {};
      viewChangeOpts.animateFrustumChange = true;
      await vp.zoomToElements([instanceId], { ...viewChangeOpts })
    }
  };

  useEffect(() => {
    const onStartup = async () => {
      if (!IModelApp.authorizationClient) {
        throw new Error(
          "AuthorizationClient is not defined. Most likely IModelApp.startup was not called yet."
        );
      }
      const token = await IModelApp?.authorizationClient?.getAccessToken();
      const fetchedReports = await reportingClientApi.getReports(token, itwinId)
      setReports(fetchedReports ?? []);
    };
    onStartup();
  }, [itwinId, reportingClientApi]);

  return (
    <>
      <div>
        {`${activeReport?.displayName ?? ''} - ${activeEntity?.name ?? ''}`}
      </div>
      {
        reports && viewState === ViewState.Reports &&
        <div className="report-table">
          <Table
            columns={reportColumns}
            data={reports as []}
            emptyTableContent="No data..."
            density="extra-condensed"
            onRowClick={(_, row) => {
              onReportRowClick(row.original);
            }}
          />
        </div>
      }
      {
        entities && viewState === ViewState.Entities &&
        <div className="entity-table">
          <Table
            columns={entityColumns}
            data={entities as []}
            emptyTableContent="No data..."
            density="extra-condensed"
            onRowClick={(_, row) => {
              onEntityRowClick(row.original);
            }}
          />
        </div>
      }
      {
        data && viewState === ViewState.Data &&
        <div className="data-table">
          <Table
            columns={dataColumns}
            data={data as []}
            emptyTableContent="No data..."
            density="extra-condensed"
            onRowClick={(_, row) => {
              onDataRowClick((row.original as any)?.ECInstanceId);
            }}
          />
        </div>
      }
    </>
  );
}

export class ReportingWidgetProvider implements UiItemsProvider {
  public readonly id: string = "ReportingWidgetProvider";

  public provideWidgets(
    _stageId: string,
    _stageUsage: string,
    location: StagePanelLocation,
    _sesction?: StagePanelSection
  ): ReadonlyArray<AbstractWidgetProps> {
    const widgets: AbstractWidgetProps[] = [];
    if (location === StagePanelLocation.Bottom) {
      widgets.push({
        id: "ReportingWidget",
        label: "Report",
        defaultState: WidgetState.Open,
        isFloatingStateSupported: true,
        getWidgetContent: () => <ReportingWidget />,
      });
    }
    return widgets;
  }
}