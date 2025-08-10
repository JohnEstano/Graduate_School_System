**Table Sizing, Padding, Spacing, Buttons, Badges, Roundness, Parent Containers**

**Table**  
\<Table className="min-w-full text-sm"\>  
  \<TableHeader\>  
    \<TableRow\>  
      \<TableHead className="w-\[5%\] py-2"\>  
        \<Checkbox checked={headerChecked} onCheckedChange={toggleSelectAll} /\>  
      \</TableHead\>  
      \<TableHead className="w-\[20%\] px-1"\>Title\</TableHead\>  
      \<TableHead className="w-\[13%\] px-1 py-2"\>Presenter\</TableHead\>  
      \<TableHead className="w-\[11%\] text-center px-1 py-2"\>Date\</TableHead\>  
      \<TableHead className="w-\[7%\] text-center px-1 py-2"\>Mode\</TableHead\>  
      \<TableHead className="w-\[7%\] text-center px-1 py-2"\>Status\</TableHead\>  
      \<TableHead className="w-\[7%\] text-center px-1 py-2"\>Priority\</TableHead\>  
      \<TableHead className="w-\[14%\] px-1 py-2 text-center"\>Last Updated\</TableHead\>  
      \<TableHead className="w-\[3%\] text-left px-1 py-2" /\>  
    \</TableRow\>  
  \</TableHeader\>  
  \<TableBody\>  
    \<TableRow className="hover:bg-muted/50"\>  
      \<TableCell className="px-2 py-2"\>...\</TableCell\>  
      \<TableCell className="px-1 py-2 font-semibold whitespace-normal break-words leading-tight" style={{ maxWidth: '130px' }}\>  
        {/\* Title and presenter \*/}  
      \</TableCell\>  
      {/\* ...other cells... \*/}  
    \</TableRow\>  
  \</TableBody\>  
\</Table\>  
 **Table font size:** text-sm  
 **Row hover:** hover:bg-muted/50  
 **Cell padding:** px-1 py-2 (horizontal 4px, vertical 8px)  
 **Header padding:** px-1 py-2  
 **Column width:** Use w-\[%\] for consistency

 **Buttons**  
\<Button  
  variant="outline"  
  className="rounded-md px-3 py-2 h-auto text-xs flex items-center gap-1"  
\>  
  \<Icon size={12} /\> Button Text  
\</Button\>  
 **Padding**: px-3 py-2  
 **Height**: h-auto for multi-line, h-8 for single-line  
 **Font size**: text-xs  
 **Roundness**: rounded-md (medium), rounded-full for pills/circles  
 **Icon size**: size={12} or size={16}

 **Badges**  
\<Badge  
  variant="outline"  
  className="rounded-full px-2 py-0.5 text-xs bg-accent text-accent-foreground"  
\>  
  Badge Text  
\</Badge\>  
 Roundness: rounded-full  
 Padding: px-2 py-0.5  
 Font size: text-xs  
 Color: Use bg-accent text-accent-foreground for neutral, or custom for status

 **Dialogs & Modals**  
\<DialogContent className="max-w-3xl min-w-260 w-full max-h-\[90vh\]"\>  
  \<div className="max-h-\[80vh\] overflow-y-auto px-1"\>  
    *{/\* Dialog content \*/}*  
  \</div\>  
\</DialogContent\>

 **Dialog max width**: max-w-3xl (48rem/768px)  
 **Dialog min width:** min-w-260 (custom, 260px)  
 **Dialog width:** w-full  
 **Dialog max heigh**t: max-h-\[90vh\]  
 **Dialog inner padding:** px-1  
 **Dialog content scroll:** overflow-y-auto

**Checkbox**  
\<Checkbox className="rounded-sm border" /\>  
 **Roundness**: rounded-sm  
 **Border:** border

**Parent Containers**  
\<div className="rounded-md overflow-x-auto border border-border p-2 bg-white"\>  
  *{/\* Table or content \*/}*  
\</div\>  
 Roundness: rounded-md  
 Border: border border-border  
 Overflow: overflow-x-auto for tables  
 Padding: p-2  
 Background: bg-white or bg-card

 **Spacing & Gaps**  
 Between elements: Use gap-2 or gap-1 for flex/grid containers  
 Between sections: Use mb-2, mt-2, py-2, etc.

