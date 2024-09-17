import { Component, OnInit } from '@angular/core';
import { Chart, ChartTooltipModel, InteractionMode, ChartTooltipModelBody } from 'chart.js';
import { GRAPHDATA } from '../shared/graphData';
import { SpendItem, GraphDataItem } from '../shared/interface';

@Component({
  selector: 'app-graph-line-chart',
  templateUrl: './graph-line-chart.component.html',
  styleUrls: ['./graph-line-chart.component.scss']
})
export class GraphLineChartComponent implements OnInit {
  private delayed: boolean = false; // Declare the delayed variable
  private graphData: any;
  private minYaxesVaule: any;
  private maxYaxesVaule: any;
  private stepSize: any;
  private chart: any;

  ngOnInit(): void {
    this.graphData = GRAPHDATA;
    const { minValue, maxValue } = this.getMinMaxSpendValues(GRAPHDATA);
    this.stepSize = 5000;
    this.minYaxesVaule = Math.floor(minValue / this.stepSize) * this.stepSize;
    this.maxYaxesVaule = Math.ceil(maxValue / this.stepSize) * this.stepSize;

    //this.registerLegendPlugin();
    this.createChart();
  }

  private formatDate(dateString: string): string {
    const year = parseInt(dateString.slice(0, 4), 10);
    const month = parseInt(dateString.slice(4, 6), 10) - 1; // Months are 0-based in JavaScript
    const day = parseInt(dateString.slice(6, 8), 10);

    const date = new Date(year, month, day);
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }

  private getMinMaxSpendValues(data: SpendItem[]): { minValue: number; maxValue: number } {
    const values = data.flatMap(item => [
      parseFloat(item.spend.v.replace(/[^0-9.-]+/g, '')),
      parseFloat(item.spendFC.v.replace(/[^0-9.-]+/g, ''))
    ]);

    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    return { minValue, maxValue };
  }

  private extractLabelAndValueSplit(input:any) {    
    if (typeof input !== 'string') {
        input = String(input); // Convert to string if it's not
    }
    // Split the string by ": " to separate the label and the value
    const parts = input.split(": ");

    // Check if the split resulted in two parts to avoid undefined errors
    if (parts.length !== 2) {
        throw new Error("Invalid input format. Expected 'label: value' format.");
    }
    
    // Get the label part (string value)
    const label = parts[0];

    // Get the value part (number value) and convert it to a number
    const value = parseFloat(parts[1].replace(/,/g, ''));
    return { label, value };
  }

  private customLegendPadding = {
    beforeInit: function(chart: any) {
      const originalFit = chart.legend.fit; // Save the original fit function

      // Override the fit function
      chart.legend.fit = function() {
        originalFit.bind(chart.legend)();
        this.height += 20; // Add 20px space below the legend
      };
    }
  }

//   private registerLegendPlugin(): void {
//     Chart.plugins.register({
//       beforeInit: function(chart: any) {
//         const originalFit = chart.legend.fit; // Save the original fit function
// 
//         // Override the fit function
//         chart.legend.fit = function() {
//           originalFit.bind(chart.legend)();
//           this.height += 20; // Add 20px space below the legend
//         };
//       }
//     });
//   } 

private chartDottedLine = {  
  afterDatasetsDraw: function(chart: any) {    
    if (chart.tooltip._active && chart.tooltip._active.length && chart.config.type === 'line') {
      const ctx = chart.ctx;
      const activePoint = chart.tooltip._active[0];
  
      if (activePoint) {
        const x = activePoint.tooltipPosition().x;  // Use tooltipPosition() to get the correct coordinates in Chart.js 2.x
        const yScale = activePoint._yScale;  // Access the correct y-scale in Chart.js 2.x
        const topY = yScale.top;
        const bottomY = yScale.bottom;
  
        // Draw line
        ctx.save();
        ctx.beginPath();        
        ctx.moveTo(x, topY);
        ctx.lineTo(x, bottomY);
        ctx.setLineDash([2, 3]);
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#ff7e01';
        ctx.stroke();
        ctx.restore();  
      }  
    }
  }
};

private chartAreaBorder = {  
  beforeDraw: function(chartInstance: any) {    
    const ctx = chartInstance.chart.ctx;
    const chartArea = chartInstance.chartArea;
    
    var options = chartInstance.options.plugins.chartAreaBorder;

    ctx.save();
    ctx.strokeStyle = options.customBorderColor || '#000';
    ctx.lineWidth = options.customBorderWidth || 2;
    ctx.setLineDash(options.customBorderDash || [5, 5]);
    ctx.lineDashOffset = options.customBorderDashOffset || 0;
    
    ctx.strokeRect(chartArea.left, chartArea.top, chartArea.right-chartArea.left, chartArea.bottom-chartArea.top);    
    ctx.restore();      
  }
};
  private createChart(): void {
    const ctx = document.getElementById('acquisitions') as HTMLCanvasElement;    
    this.chart = new Chart(ctx, {
      type: 'line',
      plugins: [this.customLegendPadding, this.chartDottedLine, this.chartAreaBorder],
      data: {
        labels: this.graphData.map((row: GraphDataItem) => this.formatDate(row.sortKey.v)),
        datasets: [
          {
            label: 'Actual Spend',
            borderColor: '#21D598',
            backgroundColor: 'rgba(85, 220, 176, 0.2)',
            pointBackgroundColor: '#58e0b2',
            pointHoverBackgroundColor: '#58e0b2',
            borderWidth: 1,
            fill: false,
            data: this.graphData.map((row: GraphDataItem) => ({
              x: this.formatDate(row.sortKey.v),
              y: row.spend.n
            }))
          },
          {
            label: 'Target Spend',
            borderColor: '#FFD32A',
            backgroundColor: 'rgba(255, 211, 42, 0.2)',
            pointBackgroundColor: '#ffd32a',
            pointHoverBackgroundColor: '#ffd32a',
            borderWidth: 1,
            fill: false,
            data: this.graphData.map((row: GraphDataItem) => ({
              x: this.formatDate(row.sortKey.v),
              y: parseFloat(row.spendFC.v.replace(/[^0-9.]/g, ''))
            }))
          }
        ]
      },
      options: this.getChartOptions(),
    });
  }

  private getChartOptions() {
    return {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          top: 0,
          right: 0,
          bottom: 70,
          left: 0
        }
      },
      animation: {
        radius: {
          duration: 40000,
          easing: 'easeInOutBounce',          
          loop: (context: { active: boolean }) => context.active,
        },
        onComplete: () => {          
          this.delayed = true;
        },
        onProgress: function(animation: any) {          
        },
        delay: (context: { type: string; mode: string; dataIndex: number; datasetIndex: number }) => {
          let delay = 0;
          if (context.type === 'data' && context.mode === 'default' && !this.delayed) {
            delay = context.dataIndex * 100 + context.datasetIndex * 100;
          }
          return delay;
        },
      },      
      tooltips: {
        enabled: false, // Disable the default on-canvas tooltip
        mode: 'index' as InteractionMode,        
        intersect: false,        
        custom: this.externalTooltipHandler.bind(this)
      },
      scales: {
        xAxes: [{
          gridLines: {
            color: '#E6E9F1',
            drawBorder: false
          },
          ticks: {
            fontSize: 14,
            fontColor: '#999FAC',
            fontFamily: 'SF Pro Display',
            padding: 10
          }
        }],
        yAxes: [{
          gridLines: {
            color: '#E6E9F1',
            drawBorder: false
          },
          ticks: {
            fontSize: 14,
            fontColor: '#999FAC',
            fontFamily: 'SF Pro Display',
            beginAtZero: true,
            stepSize: this.stepSize,
            min: 0,
            max: this.maxYaxesVaule,
            callback: (value: number) => {
              return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","); // Add commas
            },
            padding: 20
          }
        }]
      },
      legend: {
        display: true,        
        labels: {
          fontColor: '#0F131B',
          usePointStyle: true,
          boxWidth: 5,
          fontSize: 14,
          padding: 20,
          innerHeight: 50
        }
      },   
      plugins: {        
        chartAreaBorder: {  // Reference the plugin here
          customBorderColor: 'green',  // Set custom border color
          customBorderWidth: 1,  // Set custom border width
          customBorderDash: [5, 5],  // Set custom dash style
          customBorderDashOffset: 2  // Set custom dash offset
        }     
      }   
    };
  }

  private externalTooltipHandler(tooltipModel: ChartTooltipModel) {    
    let tooltipEl = document.getElementById('chartjs-tooltip');
    let iconContainer = document.getElementById('event-icons-container');
    let styleMetric = 'display: flex; flex-direction: row; justify-content: flex-start;';
    let styleTitleFont = "font-family: 'SF Pro Display'; font-size: 12px; font-weight: 500; text-align: left; margin: 0; color: #0F131B; line-height: 1.8;";

    // Create element on first render
    if (!tooltipEl) {
      tooltipEl = document.createElement('div');
      tooltipEl.id = 'chartjs-tooltip';
      tooltipEl.style.opacity = '0';
      tooltipEl.style.background = '#fff';
      tooltipEl.style.border = '1px solid #E4E6E9';
      tooltipEl.style.borderRadius = '5px';
      tooltipEl.style.padding = '10px 10px';
      tooltipEl.style.margin = '0 10px';
      tooltipEl.style.minWidth = '237px';
      // tooltipEl.style.maxWidth = '237px';
      tooltipEl.style.wordBreak = 'break-all';
      tooltipEl.style.pointerEvents = 'none';
      tooltipEl.style.position = 'absolute';
      tooltipEl.style.transition = 'all .1s ease';
      document.body.appendChild(tooltipEl);
    }
    
    // Create the icon container if it doesn't exist
    if (!iconContainer) {
      iconContainer = document.createElement('div');
      iconContainer.id = 'event-icons-container';
      iconContainer.style.position = 'absolute';
      iconContainer.style.padding = '10px';
      iconContainer.style.display = 'flex';
      iconContainer.style.flexFlow = 'column';
      iconContainer.style.gap = '10px';
      document.body.appendChild(iconContainer);
    }

    // Hide if no tooltip
    //const tooltipModel = context.tooltip;
    if (tooltipModel.opacity === 0) {
      tooltipEl.style.opacity = '0';
      return;
    }

    // Set caret position
    tooltipEl.classList.remove('above', 'below', 'no-transform');
    if (tooltipModel.yAlign) {
      tooltipEl.classList.add(tooltipModel.yAlign);
    } else {
      tooltipEl.classList.add('no-transform');
    }    
    // Set Text
    if (tooltipModel) {
      const titleLines = tooltipModel.title || [];            
      const bodyLines: string[][] = tooltipModel.body.map((item: ChartTooltipModelBody) => item.lines);
  
      let innerHtml = '<thead>';
      let styleTooltipTitle = "font-family: 'SF Pro Display'; font-size: 12px;font-weight: 500; text-align: left; color: #999FAC;";
      titleLines.forEach((title: string) => {            
        innerHtml += `<tr><th style="${styleTooltipTitle}"> ${title} | Calendar Events </th></tr>`;
      });
      innerHtml += '</thead><tbody>';            
      bodyLines.forEach((body: string[], i: number) => {
        const colors = tooltipModel.labelColors[i];            
        let style = `background: ${colors.backgroundColor}; border-color: ${colors.borderColor}; border-width: 7px; width: 7px; height: 7px; border-radius: 50%; gap: 10px; margin-right: 5px; line-height: 1.5; margin-top: 6px;`;
        let styleBudgetFont = `font-family: 'SF Pro Display'; font-size: 12px;font-weight: 500; text-align: left; margin: 0; color: ${colors.backgroundColor};`;
        let label = this.extractLabelAndValueSplit(body).label;
        let value = this.extractLabelAndValueSplit(body).value;

        if(label.includes('Actual Spend')){
          if(bodyLines.length == 2 ){
            label += ': ' + ((this.extractLabelAndValueSplit(bodyLines[0]).value / this.extractLabelAndValueSplit(bodyLines[1]).value)*100).toFixed(2) + '%';
          }              
        }
        const metricContent = `<div style="${styleMetric}"><div class="icon-dot" style="${style}"></div><div><p style="${styleTitleFont}">${label}</p><p style="${styleBudgetFont}">$${value}</p></div></div>`;
        innerHtml += `<tr><td>${metricContent}</td></tr>`;
      });

      // Add custom event data to the tooltip      
      const indexDate = tooltipModel.dataPoints[0]?.index || 0;      
      
      const events = this.graphData[indexDate].eventIcons?.events || [];
      let styleEventTitle = "font-family: 'SF Pro Display'; font-size: 12px;font-weight: 500; text-align: left; color: #999FAC; padding-top: 10px;";
      if (events.length > 0) {
        innerHtml += `<tr><th style="${styleEventTitle}">Events</th></tr>`;
        let styleBudgetFont = `font-family: 'SF Pro Display'; font-size: 12px;font-weight: 500; text-align: left; margin: 0;`;            
        let revenueStyle: any;
        if(events.revenue < 0){
          revenueStyle = "font-family: 'SF Pro Display'; font-size: 12px;font-weight: 500; text-align: left; margin: 0; color: #F33053;";
        }else{
          revenueStyle = "font-family: 'SF Pro Display'; font-size: 12px;font-weight: 500; text-align: left; margin: 0; color: #14AB78;";
        }
        
        for(let index = 0; index < events.length; index++) {
          let evetName = events[index].type;
          let eventIndex;
          if(evetName.includes('email')==true){
            eventIndex = 1;
          }else if(evetName.includes('google')==true){
            eventIndex = 2;
          }else{
            eventIndex = 3;
          }
          // Update the style for each event using the eventIndex to dynamically set the background image
          let style = `
            width: 12px; 
            height: 12px; 
            border-radius: 50%;
            gap: 10px; 
            margin-right: 5px; 
            line-height: 1.5; 
            margin-top: 6px; 
            background-image: url('../../assets/img/star${eventIndex}.png');
            background-size: cover;
          `;              
          // Construct the event content with proper styling
          const eventContent = `
            <div style="${styleMetric}">
              <div class="icon-dot" style="${style}"></div>
              <div>
                <p style="${styleTitleFont}">${events[index].desc}</p>
                <p style="${styleBudgetFont}">
                  <span style="${styleTooltipTitle}">Revenue:</span> 
                  <span style="${revenueStyle}">$${events[index].revenue}</span>
                </p>
              </div>
            </div>
          `;
        
          // Append the event content to the tooltip's inner HTML
          innerHtml += `<tr><td>${eventContent}</td></tr>`;
          if(index == 4){     
            let moreStyle = `
              font-family: 'SF Pro Display'; 
              font-size: 12px; 
              font-weight: 500; 
              text-align: left; 
              margin: 0;
              padding-left: 20px;
              padding-top: 5px;
              color: #BC2540;
            `;
            let remainingEvents = events.length - index -1;
            let eventText = remainingEvents === 1 ? 'event' : 'events';
            if(remainingEvents != 0){
              innerHtml += `<tr><td style="${moreStyle}">more ${remainingEvents} ${eventText}...</td></tr>`;
            }                
            break;  
          }
        };            
      }

      innerHtml += '</tbody>';

      const tableRoot = tooltipEl.querySelector('table') || document.createElement('table');
      tableRoot.innerHTML = innerHtml;      
      if (!tooltipEl.querySelector('table')) {
        tooltipEl.appendChild(tableRoot);
      }
    }
        
    let canvas = this.chart.ctx.canvas;  
    let position = canvas.getBoundingClientRect();

    const tooltipWidth = tooltipEl.offsetWidth;
    const tooltipHeight = tooltipEl.offsetHeight;
    // const chartWidth = position.width;
    // const chartHeight = position.height;        

    // Calculate new positions
    let tooltipLeft = position.left + window.pageXOffset + tooltipModel.caretX;
    let tooltipTop = position.top + window.pageYOffset + tooltipModel.caretY;

    // Adjust if tooltip is too close to the edges
    if (tooltipTop + tooltipHeight > window.innerHeight) {
      tooltipTop -= tooltipHeight;
    }
    if (tooltipTop < window.pageYOffset) {
      tooltipTop = window.pageYOffset;
    }
    if (tooltipLeft + tooltipWidth > window.innerWidth) {
      tooltipLeft -= tooltipWidth;
    }
    if (tooltipLeft < window.pageXOffset) {
      tooltipLeft = window.pageXOffset;
    }

    // Display, position, and set styles for font
    tooltipEl.style.opacity = '1';
    tooltipEl.style.left = tooltipLeft + 'px';
    tooltipEl.style.top = tooltipTop + 'px';        
    tooltipEl.style.padding = tooltipModel.xPadding + 'px ' + tooltipModel.yPadding + 'px';  

    // Icon display logic (outside tooltip) - show unique event types
    const indexDate = tooltipModel.dataPoints[0]?.index || 0;          
    const events = this.graphData[indexDate].eventIcons?.events || [];
    const uniqueEventTypes = new Set(events.map((event: { type: string }) => event.type)); // Get unique event types        
    if (uniqueEventTypes.size > 0) {
      iconContainer.innerHTML = ''; // Clear any previous icons

      uniqueEventTypes.forEach((eventType) => {

        const type = eventType as string; 
        let eventIndex;
        if (type.includes('email')) {
          eventIndex = 'email';
        } else if (type.includes('google')) {
          eventIndex = 'google';
        } else if(type.includes('facebook')){
          eventIndex = 'meta'; 
        }else{
          eventIndex = 'default'; 
        }

        // Display the icon based on unique event type
        let iconStyle = `
          width: 20px; 
          height: 20px; 
          background-image: url('../../assets/img/${eventIndex}.png'); 
          background-size: cover;
        `;
        const icon = document.createElement('div');
        icon.setAttribute('style', iconStyle);
        if (iconContainer) {
          iconContainer.appendChild(icon);
        }
      });

      let canvas = this.chart.ctx.canvas;  
      let position = canvas.getBoundingClientRect();

      let tooltipLeft = position.left + window.pageXOffset + tooltipModel.caretX;
      let tooltipTop = position.top + window.pageYOffset + tooltipModel.caretY;
      const tooltipWidth = tooltipEl.offsetWidth;
      const tooltipHeight = tooltipEl.offsetHeight;

      if (tooltipLeft + tooltipWidth > window.innerWidth) {
        tooltipLeft -= tooltipWidth;
      }
      if (tooltipTop + tooltipHeight > window.innerHeight) {
        tooltipTop -= tooltipHeight;
      }

      // Position and show the icon container near the tooltip
      iconContainer.style.left = `${tooltipLeft - 25}px`;
      iconContainer.style.top = `${tooltipTop + (tooltipEl.offsetHeight / 2)}px`;
      iconContainer.style.opacity = '1';
    } else {
      if (iconContainer) {
        iconContainer.style.opacity = '0'; // Hide if no events
      }
    }
    
    // Event listener for mouse leave to hide the icon list
    const chartCanvas = document.getElementById('acquisitions'); // The canvas element
    if (chartCanvas) {
      chartCanvas.addEventListener('mouseleave', () => {
        if (iconContainer) {
          iconContainer.style.opacity = '0'; // Hide icon container on mouse leave
        }
      });
    } 
  }
}
