
import { BpmnElement, DiffResult, ModificationDetail } from '../types';

const BpmnNamespace = {
  BPMN: 'http://www.omg.org/spec/BPMN/20100524/MODEL',
  CAMUNDA: 'http://camunda.org/schema/1.0/bpmn',
};

const extractElements = (doc: XMLDocument): Map<string, BpmnElement> => {
    const elements = new Map<string, BpmnElement>();
    const processElements = doc.querySelectorAll('process *[id]');
  
    processElements.forEach(node => {
        const element = node as Element;
        const id = element.getAttribute('id');
        if (!id) return;

        const properties: Record<string, string> = {};
        for (let i = 0; i < element.attributes.length; i++) {
            const attr = element.attributes[i];
            properties[attr.name] = attr.value;
        }

        // Also get camunda properties from extensionElements
        const extensionElements = element.querySelector('extensionElements');
        if (extensionElements) {
            const camundaProps = extensionElements.querySelectorAll('*');
            camundaProps.forEach(prop => {
                const key = `camunda:${prop.localName}`;
                // This is a simplification; could be more complex (e.g., lists, nested elements)
                properties[key] = prop.textContent || prop.getAttribute('class') || '';
            });
        }

        // Get incoming/outgoing sequence flows
        const incoming = Array.from(element.getElementsByTagNameNS(BpmnNamespace.BPMN, 'incoming')).map(n => n.textContent).filter(Boolean) as string[];
        const outgoing = Array.from(element.getElementsByTagNameNS(BpmnNamespace.BPMN, 'outgoing')).map(n => n.textContent).filter(Boolean) as string[];
        properties['incoming'] = incoming.join(',');
        properties['outgoing'] = outgoing.join(',');

        elements.set(id, {
            id,
            type: element.localName,
            name: element.getAttribute('name') || '',
            properties,
        });
    });

    return elements;
};


export const compareBpmn = (xml1: string, xml2: string): DiffResult => {
    const parser = new DOMParser();
    const doc1 = parser.parseFromString(xml1, "application/xml");
    const doc2 = parser.parseFromString(xml2, "application/xml");

    if (doc1.getElementsByTagName("parsererror").length || doc2.getElementsByTagName("parsererror").length) {
        throw new Error("Invalid XML file provided.");
    }

    const elements1 = extractElements(doc1);
    const elements2 = extractElements(doc2);

    const added: string[] = [];
    const removed: string[] = [];
    const modified: ModificationDetail[] = [];
    const addedDetails: BpmnElement[] = [];
    const removedDetails: BpmnElement[] = [];

    const allIds = new Set([...elements1.keys(), ...elements2.keys()]);

    allIds.forEach(id => {
        const el1 = elements1.get(id);
        const el2 = elements2.get(id);

        if (el1 && !el2) {
            removed.push(id);
            removedDetails.push(el1);
        } else if (!el1 && el2) {
            added.push(id);
            addedDetails.push(el2);
        } else if (el1 && el2) {
            const changes: ModificationDetail['changes'] = [];
            const allProps = new Set([...Object.keys(el1.properties), ...Object.keys(el2.properties)]);
            
            allProps.forEach(prop => {
                // Ignore layout-specific properties
                if (prop.startsWith('xmlns') || prop.startsWith('bpmndi')) return;

                const val1 = el1.properties[prop];
                const val2 = el2.properties[prop];

                if (val1 !== val2) {
                    changes.push({
                        property: prop,
                        oldValue: val1 === undefined ? null : val1,
                        newValue: val2 === undefined ? null : val2
                    });
                }
            });

            if (changes.length > 0) {
                modified.push({
                    id: el1.id,
                    name: el1.name || el2.name,
                    type: el1.type,
                    changes
                });
            }
        }
    });

    return { added, removed, modified, addedDetails, removedDetails };
};
